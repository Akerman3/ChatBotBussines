// functions/src/backup.ts
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

initializeApp();

const ALLOWED_ORIGINS = [
  "*",                         // (simple) o pon aquí tus orígenes exactos
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
];

function setCors(res: any, origin: string | undefined) {
  const allowOrigin =
    origin && origin !== "null"
      ? origin
      : "*";
  res.set("Access-Control-Allow-Origin",
    ALLOWED_ORIGINS.includes("*") ? "*" : allowOrigin
  );
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.set("Access-Control-Max-Age", "86400");
}

export const backupGetLatest = onRequest({ region: "us-central1" }, async (req, res) => {
  setCors(res, req.headers.origin);

  // Preflight de CORS
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    if (req.method !== "POST") {
      res.status(405).send("Only POST");
      return;
    }

    // === 1) Validar ID token ===
    const authHeader = req.headers.authorization || "";
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      res.status(401).send("Missing Authorization: Bearer <idToken>");
      return;
    }
    const idToken = m[1].trim();

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const uid = decoded.uid;
    if (!uid) {
      res.status(401).send("Invalid token (no uid)");
      return;
    }

    // === 2) Resolver path (de cuerpo o del índice) ===
    const { path: bodyPath } = (req.body ?? {}) as { path?: string };
    let path = bodyPath || `backups/${uid}/latest.json`;

    try {
      const snap = await getFirestore()
        .doc(`users/${uid}/backups/latest`)
        .get();
      const data = snap.exists ? (snap.data() as any) : null;
      if (data?.path && typeof data.path === "string") {
        path = data.path;
      }
    } catch (e) {
      logger.warn("index read error (continuing with default path)", e);
    }

    // === 3) Descargar del bucket y devolver texto ===
    const bucket = getStorage().bucket(); // usa storageBucket del proyecto
    const file = bucket.file(path);
    const [buf] = await file.download();  // lanza si no existe o sin permisos
    const text = buf.toString("utf8");

    res.set("Content-Type", "application/json; charset=utf-8");
    res.status(200).send(text);
  } catch (e: any) {
    logger.error(e);
    const code = Number(e?.code) || 500;
    // Si verifyIdToken falla normalmente es 401
    if (String(e?.message || "").includes("auth")) {
      res.status(401).send(e?.message || "Unauthorized");
      return;
    }
    res.status(code >= 400 && code < 600 ? code : 500)
       .send(`Error: ${e?.message || String(e)}`);
  }
});
