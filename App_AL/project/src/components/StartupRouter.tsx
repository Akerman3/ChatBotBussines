// src/components/StartupRouter.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import {
  loadOfflineSubFor,
  isOfflineSubActive,
  saveOfflineSubFor,
  OfflineSubState,
} from "../lib/offlineSubStorage";
import { acquireOrRenewLockForUser } from "../lib/deviceLock";
import { Preferences } from "@capacitor/preferences";
import { downloadLatestBackup } from "../lib/cloudBackup";
import { restoreFromJsonString } from "../utils/backupManager";

// ---------------------- UI Loader (con modo restauración) ----------------------
// Mantiene el look original (imagen, tamaños y colores) + anima los tres puntitos
function FullscreenLoader({ isRestoring = false }: { isRestoring?: boolean }) {
  const [dots, setDots] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setDots((d) => (d + 1) % 4), 550);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg, #0b254d 0%, #0b1b32 100%)", // como tu original
        zIndex: 9999,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center", // asegura que el icono quede perfectamente centrado con el texto
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        {/* Icono animado si está restaurando */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <img
            src="/assets/home.png"
            alt="AL"
            width={72}
            height={72}
            style={{
              opacity: 0.95,
              display: "block",
              zIndex: 2
            }}
          />
          {isRestoring && (
            <div style={{
              position: 'absolute',
              top: -10, left: -10, right: -10, bottom: -10,
              zIndex: 1
            }}>
              <svg viewBox="0 0 50 50" style={{ width: 92, height: 92, animation: 'rotate-spinner 2s linear infinite' }}>
                <circle
                  cx="25" cy="25" r="23"
                  fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2"
                />
                <circle
                  cx="25" cy="25" r="23"
                  fill="none" stroke="white" strokeWidth="2"
                  strokeDasharray="90, 150"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  style={{ animation: 'dash-spinner 1.5s ease-in-out infinite' }}
                />
              </svg>
            </div>
          )}
        </div>

        {/* Título exactamente como lo tenías */}
        <div
          style={{
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: 0.2,
            color: "#e5e7eb",
          }}
        >
          AL Calculadora
        </div>

        {/* "Cargando" o "Restableciendo" con tres puntitos animados */}
        <div
          style={{
            marginTop: 6,
            opacity: 0.8,
            color: "#e5e7eb",
            fontSize: 16,
            fontWeight: 600,
            height: 22,
          }}
        >
          {isRestoring ? "Restableciendo sesión" : "Cargando"}
          {".".repeat(dots)}
        </div>

        {isRestoring && (
          <div style={{ color: '#fff', fontSize: 12, marginTop: 10, opacity: 0.6 }}>
            Esto solo ocurrirá esta vez
          </div>
        )}

        <style>{`
          @keyframes rotate-spinner {
            100% { transform: rotate(360deg); }
          }
          @keyframes dash-spinner {
            0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
            50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
            100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
          }
        `}</style>
      </div>
    </div>
  );
}

// ---------------------- Avisos Home (compatibilidad) ----------------------
const KICK_LS_KEY = "alcalc.kickNotice.v1";
const DEVLOCK_LS_KEY = "alcalc.deviceLockNotice.v1";
function setKickNotice(message: string) {
  try {
    localStorage.setItem(
      KICK_LS_KEY,
      JSON.stringify({ ts: Date.now(), message })
    );
  } catch { }
}
function clearKickNotice() {
  try {
    localStorage.removeItem(KICK_LS_KEY);
  } catch { }
}
function setDeviceLockNotice(message: string) {
  try {
    localStorage.setItem(
      DEVLOCK_LS_KEY,
      JSON.stringify({ ts: Date.now(), message })
    );
  } catch { }
}
function clearDeviceLockNotice() {
  try {
    localStorage.removeItem(DEVLOCK_LS_KEY);
  } catch { }
}

// ---------------------- Lógica de LOCK Offline ----------------------
// (sin cambios: lógica intacta)
const DEV_ID_KEY = "alcalc.deviceId";
const LOCAL_LOCK_KEY = (uid: string) => `alcalc.deviceLock.current.${uid}`;

async function ensureDeviceId(): Promise<string> {
  const existing = await Preferences.get({ key: DEV_ID_KEY });
  if (existing.value) return existing.value;
  const id = cryptoRandomId();
  await Preferences.set({ key: DEV_ID_KEY, value: id });
  return id;
}
function cryptoRandomId(): string {
  const rnd = (n = 16) =>
    Array.from(crypto.getRandomValues(new Uint8Array(n)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  return `${rnd(2)}-${rnd(2)}-${rnd(2)}-${rnd(2)}`;
}

type LocalLock = {
  uid: string;
  ownerDeviceId: string;
  updatedAt: number;
};

async function readLocalLock(uid: string): Promise<LocalLock | null> {
  const { value } = await Preferences.get({ key: LOCAL_LOCK_KEY(uid) });
  if (!value) return null;
  try {
    return JSON.parse(value) as LocalLock;
  } catch {
    return null;
  }
}

async function writeLocalLock(uid: string, ownerDeviceId: string) {
  const lock: LocalLock = { uid, ownerDeviceId, updatedAt: Date.now() };
  await Preferences.set({
    key: LOCAL_LOCK_KEY(uid),
    value: JSON.stringify(lock),
  });
}

function isOwnedByThisDevice(lock: LocalLock | null, deviceId: string) {
  return !!(lock && lock.ownerDeviceId === deviceId);
}

// ---------------------- Componente ----------------------
const StartupRouter: React.FC = () => {
  const nav = useNavigate();
  const didNav = useRef(false);
  const [showLoader, setShowLoader] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);

  const navigateOnce = (path: string) => {
    if (didNav.current) return;
    didNav.current = true;
    setShowLoader(false);
    nav(path, { replace: true });
  };

  // Lock con red
  const tryEnterMainWithLockOnline = async (uid: string) => {
    try {
      const ok = await acquireOrRenewLockForUser(uid);
      if (ok) {
        clearKickNotice();
        clearDeviceLockNotice();
        navigateOnce("/main");
      } else {
        const msg =
          "Tu cuenta está activa en otro dispositivo. Cierra sesión allí o vuelve a intentarlo más tarde.";
        setKickNotice(msg);
        setDeviceLockNotice(msg);
        navigateOnce("/home");
      }
    } catch {
      const msg =
        "No se pudo verificar el dispositivo. Intenta de nuevo con conexión a internet.";
      setKickNotice(msg);
      setDeviceLockNotice(msg);
      navigateOnce("/home");
    }
  };

  // Lock sin red
  const tryEnterMainWithLockOffline = async (uid: string) => {
    const deviceId = await ensureDeviceId();
    const localLock = await readLocalLock(uid);

    if (isOwnedByThisDevice(localLock, deviceId)) {
      navigateOnce("/main");
      return;
    }
    if (!localLock) {
      await writeLocalLock(uid, deviceId);
      navigateOnce("/main");
      return;
    }

    const msg =
      "Tu cuenta está activa en otro dispositivo. Vuelve a intentarlo cuando tengas conexión para liberar la licencia.";
    setKickNotice(msg);
    setDeviceLockNotice(msg);
    navigateOnce("/home");
  };

  useEffect(() => {
    const auth = getAuth();
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        navigateOnce("/home");
        return;
      }

      // -------- AUTO-RESTORE CHECK --------
      // Si el usuario está autenticado pero el storage local está vacío,
      // intentamos descargar la copia de seguridad automáticamente.
      const criticalKeys = ['windowProfiles', 'alcalc_quote_fixedData_v1', 'notesCanvasComponents'];
      const isLocalEmpty = criticalKeys.every(key => !localStorage.getItem(key));

      if (isLocalEmpty) {
        const hasNet = navigator.onLine;
        if (hasNet) {
          try {
            setIsRestoring(true);
            console.log("[Startup] Local storage empty, attempting auto-restore...");
            const json = await downloadLatestBackup();
            if (json && json.length > 100) {
              const res = restoreFromJsonString(json);
              if (res.success) {
                console.log("[Startup] Auto-restore successful");
                // Pequeña pausa para que el usuario vea que algo pasó
                await new Promise(r => setTimeout(r, 1000));
              }
            }
          } catch (err) {
            console.warn("[Startup] Auto-restore skipped or failed:", err);
          } finally {
            setIsRestoring(false);
          }
        }
      }

      const email = u.email || "";
      const hasNet =
        typeof navigator !== "undefined" ? navigator.onLine : true;

      // -------- OFFLINE FIRST --------
      const localSub = email ? loadOfflineSubFor(email) : null;
      if (localSub && isOfflineSubActive(localSub)) {
        if (hasNet) {
          await tryEnterMainWithLockOnline(u.uid);
        } else {
          await tryEnterMainWithLockOffline(u.uid);
        }
        return;
      }

      // -------- ONLINE REFRESH --------
      if (hasNet) {
        try {
          const db = getFirestore();
          const ref = doc(db, "users", u.uid);

          const timer = setTimeout(() => { }, 1500);
          const snap = await getDoc(ref).catch(() => null);
          clearTimeout(timer);

          const data = snap?.data() as any | undefined;
          if (data) {
            const expiry = Number(data?.expiryTimeMillis ?? 0);
            const subState: string = String(
              data?.lastPlayState?.subscriptionState ?? ""
            );
            const label = /(CANCEL|EXPIRE|ON_HOLD|PAUSE)/i.test(subState)
              ? "Fecha de fin de suscripción:"
              : "Fecha de renovación automática:";

            const fresh: Partial<OfflineSubState> = {
              expiryTimeMillis: Number.isFinite(expiry) ? expiry : 0,
              subscriptionState: subState,
              label,
            };

            if (email) {
              await saveOfflineSubFor(email, fresh);
            }

            if (isOfflineSubActive(fresh as OfflineSubState)) {
              await tryEnterMainWithLockOnline(u.uid);
              return;
            }
          }
        } catch {
          // ignorar
        }
      }

      // -------- Sin internet y sin caché activo, o sigue inactiva --------
      navigateOnce("/home");
    });

    return () => unsub();
  }, [nav]);

  return showLoader ? <FullscreenLoader isRestoring={isRestoring} /> : null;
};

export default StartupRouter;
