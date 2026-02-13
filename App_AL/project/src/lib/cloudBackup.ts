// src/lib/cloudBackup.ts
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadString,
} from "firebase/storage";

export interface UploadBackupResult {
  path: string;
  url?: string;
  size: number;
}

/** Tamaño de string en bytes (UTF-8) */
function bytesOf(str: string): number {
  try { return new TextEncoder().encode(str).length; }
  catch { return str.length; }
}

const TAG = (p: string) => `[ALC][backup:svc:${p}]`;

// ⚙️ URL del proxy (Cloud Function HTTPS v2).
// En .env / .env.production define:
// VITE_BACKUP_PROXY_URL=https://us-central1-<tu-proyecto>.cloudfunctions.net/backupGetLatest
// 👇 IMPORTANTE: leerla literal para que Vite la inyecte
const PROXY_URL = import.meta.env.VITE_BACKUP_PROXY_URL as string | undefined;

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
function withTimeout<T>(p: Promise<T>, ms: number, tag: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${tag}-timeout-${ms}ms`)), ms)
    ),
  ]);
}

async function fetchViaProxy(
  url: string,
  idToken: string,
  body: any,
  timeoutMs: number
): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // En HTTPS v2 con Firebase Auth se usa Bearer
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
    const text = await resp.text();
    if (!text || bytesOf(text) === 0) throw new Error("Respuesta vacía del proxy.");
    return text;
  } finally {
    clearTimeout(t);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// UPLOAD (igual que antes, directo a Storage)
// ───────────────────────────────────────────────────────────────────────────────
export async function uploadBackup(jsonString: string): Promise<UploadBackupResult> {
  const t0 = Date.now();
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) {
    console.warn(TAG("upload"), "no-auth-user");
    throw new Error("No hay usuario autenticado.");
  }

  const storage = getStorage();
  const db = getFirestore();

  const bucket = (storage.app.options as any)?.storageBucket || "(unknown-bucket)";
  const path = `backups/${uid}/latest.json`;
  const fileRef = ref(storage, path);
  const size = bytesOf(jsonString);

  console.log(TAG("upload"), `start uid=${uid} bucket=${bucket} path=${path} bytes=${size}`);

  await uploadString(fileRef, jsonString, "raw", { contentType: "application/json" })
    .catch((e) => {
      console.error(TAG("upload"), "ERR:", e?.code || e?.message || e);
      throw e;
    });

  // Guardar índice (opcional, no crítico si falla)
  try {
    await setDoc(
      doc(db, "users", uid, "backups", "latest"),
      {
        path,
        url: null, // nuestras reglas pueden bloquear getDownloadURL
        size,
        updatedAt: serverTimestamp(),
        app: "AL Calculadora",
        v: 1,
      },
      { merge: true }
    );
  } catch (e: any) {
    console.warn(TAG("index"), "write skipped/ERR:", e?.code || e?.message || e);
  }

  console.log(TAG("upload"), `done in ${Date.now() - t0}ms`);
  return { path, url: undefined, size };
}

// ───────────────────────────────────────────────────────────────────────────────
// DOWNLOAD: SOLO PROXY
// ───────────────────────────────────────────────────────────────────────────────
export async function downloadLatestBackup(): Promise<string> {
  const t0 = Date.now();

  const auth = getAuth();
  const user = auth.currentUser;
  const uid = user?.uid;
  if (!uid) {
    console.warn(TAG("download"), "no-auth-user");
    throw new Error("No hay usuario autenticado.");
  }

  if (!PROXY_URL) {
    console.error(TAG("env"), "VITE_BACKUP_PROXY_URL no está definida");
    throw new Error("Proxy no configurado (VITE_BACKUP_PROXY_URL).");
  }
  console.log(TAG("env"), "VITE_BACKUP_PROXY_URL =", PROXY_URL);

  const db = getFirestore();

  // 1) Path desde índice si existe
  let path = `backups/${uid}/latest.json`;
  try {
    const snap = await getDoc(doc(db, "users", uid, "backups", "latest"));
    const data = snap.exists() ? (snap.data() as any) : null;
    if (data?.path && typeof data.path === "string") {
      path = data.path;
      console.log(TAG("index"), `using indexed path: ${path}`);
    } else {
      console.log(TAG("index"), "no index doc; using default path");
    }
  } catch (e: any) {
    console.warn(TAG("index"), "read ERR (continue with default path):", e?.code || e?.message || e);
  }

  // 2) Llamar SOLO al proxy
  try {
    const idToken = await user.getIdToken(false);
    const text = await withTimeout(
      fetchViaProxy(PROXY_URL, idToken, { path }, 25_000),
      26_000,
      "proxy"
    );
    const bytes = bytesOf(text);
    console.log(TAG("download"), `OK (proxy) bytes=${bytes} in ${Date.now() - t0}ms`);
    return text;
  } catch (e: any) {
    const detail = `${e?.name || e?.code || "unknown"}: ${e?.message || e}`;
    console.error(TAG("proxy"), "falló:", detail);
    throw new Error(`Fallo de red al descargar el backup vía proxy. Detalle: ${detail}`);
  }
}
