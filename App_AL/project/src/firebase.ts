// src/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ✅ SEGURIDAD: Credenciales cargadas desde variables de entorno
// Configura estas variables en tu archivo .env (desarrollo) y .env.production (producción)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ✅ Init idempotente (evita doble inicialización si algún módulo importa este archivo dos veces)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Singletons
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app); // ← ahora disponible si lo quieres usar directamente

// ✅ Persistencia offline Firestore (si falla, NO rompe nada)
enableIndexedDbPersistence(db).catch(() => {
  // En Capacitor (una sola webview) no deberías ver conflictos multi-tab.
  // Si falla, seguimos sin persistencia sin romper nada.
});

// Logs de diagnóstico (útiles mientras integramos backups)
try {
  console.log(
    `[ALC][firebase] init ok | app=${app.name} | bucket=${firebaseConfig.storageBucket}`
  );
} catch {}
export default app;
