// src/lib/deviceLock.ts
import { App as CapacitorApp } from "@capacitor/app";
import { Device } from "@capacitor/device";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * Estructura del lock en Firestore:
 * users/{uid}/deviceLock/current
 *  - deviceId: string
 *  - platform: 'android' | 'ios' | 'web' | string
 *  - appBuild: number | null
 *  - acquiredAt: Timestamp
 *  - releasedAt?: Timestamp | null
 *  - status: 'active' | 'released'
 */

export type DeviceLockDoc = {
  deviceId: string;
  platform: string;
  appBuild: number | null;
  acquiredAt: any;
  releasedAt?: any | null;
  status: "active" | "released";
};

async function getLocalDeviceId(): Promise<string> {
  // Device.getId() devuelve un identificador estable por instalación.
  const info = await Device.getId();
  // Fallback ultra defensivo
  return info.identifier || "unknown-" + (await Device.getInfo()).model;
}

async function getAppBuild(): Promise<number | null> {
  try {
    const info = await CapacitorApp.getInfo();
    const n = Number((info as any)?.build ?? 0);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function lockRef(uid: string) {
  const db = getFirestore();
  return doc(db, "users", uid, "deviceLock", "current");
}

/**
 * Intenta ADQUIRIR la “llave” para este dispositivo.
 * - Si NO existe lock → lo crea y queda ACTIVE.
 * - Si existe:
 *     - si deviceId coincide y status!='released' → OK (idempotente)
 *     - si es de OTRO device y status='active' → lanza Error("LOCK_TAKEN")
 *     - si status='released' → lo reasigna a este device
 */
export async function acquireDeviceLock(uid: string): Promise<"ok"> {
  const dbRef = lockRef(uid);
  const deviceId = await getLocalDeviceId();
  const platform = (await Device.getInfo()).platform || "unknown";
  const appBuild = await getAppBuild();

  await runTransaction(getFirestore(), async (tx) => {
    const snap = await tx.get(dbRef);
    if (!snap.exists()) {
      tx.set(dbRef, {
        deviceId,
        platform,
        appBuild,
        acquiredAt: serverTimestamp(),
        releasedAt: null,
        status: "active",
      } as DeviceLockDoc);
      return;
    }
    const cur = snap.data() as DeviceLockDoc;

    // mismo device → mantener activo (idempotente)
    if (cur.deviceId === deviceId && cur.status !== "released") {
      return;
    }

    // si está liberado, lo reasignamos a este device
    if (cur.status === "released") {
      tx.set(dbRef, {
        deviceId,
        platform,
        appBuild,
        acquiredAt: serverTimestamp(),
        releasedAt: null,
        status: "active",
      } as DeviceLockDoc);
      return;
    }

    // si es de otro dispositivo y está activo → bloquear
    if (cur.deviceId !== deviceId && cur.status === "active") {
      throw new Error("LOCK_TAKEN");
    }

    // Cualquier otro caso raro → reasignación segura
    tx.set(dbRef, {
      deviceId,
      platform,
      appBuild,
      acquiredAt: serverTimestamp(),
      releasedAt: null,
      status: "active",
    } as DeviceLockDoc);
  });

  return "ok";
}

/** ✅ Alias para compatibilidad con StartupRouter:
 * intenta adquirir o “renovar” la llave usando el mismo flujo idempotente.
 */
export async function acquireOrRenewLockForUser(uid: string): Promise<"ok"> {
  return acquireDeviceLock(uid);
}

/**
 * Libera la “llave”.
 * Es SEGURO llamarlo sin conexión: quedará en cola y se sincroniza cuando haya internet.
 * Idempotente (si ya estaba liberado no pasa nada).
 */
export async function releaseDeviceLock(uid: string): Promise<void> {
  const ref = lockRef(uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const cur = snap.data() as DeviceLockDoc;
    if (cur.status === "released") return;

    await updateDoc(ref, { status: "released", releasedAt: serverTimestamp() });
  } catch {
    // Si falla (p. ej. offline), forzamos escritura (persistirá local y se subirá luego)
    await setDoc(
      ref,
      {
        status: "released",
        releasedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

/**
 * Útil si quieres “resetear” (administrativo). No lo usaremos en cliente normalmente.
 */
export async function hardDeleteDeviceLock(uid: string): Promise<void> {
  try {
    await deleteDoc(lockRef(uid));
  } catch {}
}

/**
 * Helper: verifica rápidamente si la sesión actual (si la hay) tiene lock válido.
 * Regresa:
 *  - "ok" si no hay lock o el lock pertenece a este dispositivo o está released
 *  - "taken" si el lock activo pertenece a OTRO dispositivo
 */
export async function checkLockStatusForCurrentUser(): Promise<"ok" | "taken"> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return "ok"; // sin sesión no hay bloqueo de dispositivo

  const ref = lockRef(user.uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return "ok";

    const cur = snap.data() as DeviceLockDoc;
    if (cur.status === "released") return "ok";

    const myId = await getLocalDeviceId();
    return cur.deviceId === myId ? "ok" : "taken";
  } catch {
    // si no podemos leer, no bloqueamos la UX (lo tratamos como "ok")
    return "ok";
  }
}
