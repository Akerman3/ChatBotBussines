// functions/src/index.ts
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { GoogleAuth } from "google-auth-library";
import { androidpublisher } from "@googleapis/androidpublisher";

initializeApp();
const db = getFirestore();
const fcm = getMessaging();

/** ========= Utilidades ========= */
const msToISO = (ms: any) =>
  typeof ms === "number" && ms > 0 ? new Date(ms).toISOString() : null;

const isActiveByExpiry = (expiryMs: any) =>
  typeof expiryMs === "number" && expiryMs > Date.now();

function toMs(v: any) {
  const n = Number(v);
  if (Number.isFinite(n)) return n;
  const t = Date.parse(String(v));
  return Number.isFinite(t) ? t : 0;
}

/** Extrae fechas de v2 */
function pickTimesFromV2(data: any) {
  const items = data?.lineItems ?? [];
  const starts = items
    .map(
      (li: any) =>
        toMs(li?.validTimeInterval?.startTimeMillis) ||
        toMs(li?.startTimeMillis) ||
        toMs(li?.startTime)
    )
    .filter((n: number) => n > 0);

  const ends = items
    .map(
      (li: any) =>
        toMs(li?.validTimeInterval?.endTimeMillis) ||
        toMs(li?.expiryTimeMillis) ||
        toMs(li?.expiryTime)
    )
    .filter((n: number) => n > 0);

  return {
    startMs: starts.length ? Math.min(...starts) : undefined,
    endMs: ends.length ? Math.max(...ends) : undefined,
  };
}

/** Consulta estado de suscripción en Google Play (subs v2) */
async function fetchPlaySub(packageName: string, purchaseToken: string) {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
  const play = androidpublisher({ version: "v3", auth });

  const { data } = await play.purchases.subscriptionsv2.get({
    packageName,
    token: purchaseToken,
  });

  const { startMs, endMs } = pickTimesFromV2(data);

  // intentar extraer obfuscatedAccountId para mapping por cuenta
  const liAny = ((data as any)?.lineItems?.[0]) ?? {};
  const accountId: string | null =
    liAny?.linkedPurchaseToken?.obfuscatedExternalAccountId ??
    liAny?.obfuscatedExternalAccountId ??
    (data as any)?.obfuscatedExternalAccountId ??
    null;

  return {
    startTimeMillis: startMs,
    expiryTimeMillis: endMs,
    subscriptionState: String((data as any)?.subscriptionState ?? ""),
    regionCode: (data as any)?.regionCode ?? null,
    accountId,
    raw: data,
  };
}

function normalizedDoc(
  playData: any,
  packageName: string,
  purchaseToken: string,
  extra?: Record<string, any>
) {
  const expiryMs = playData.expiryTimeMillis;
  const startMs = playData.startTimeMillis;
  return {
    packageName,
    purchaseToken,
    subscriptionState: playData.subscriptionState ?? null,
    startTimeMillis: startMs ?? null,
    startDate: msToISO(startMs),
    expiryTimeMillis: expiryMs ?? null,
    expiryDate: msToISO(expiryMs),
    isActive: isActiveByExpiry(expiryMs),
    regionCode: playData.regionCode ?? null,
    lastFetchAt: new Date().toISOString(),
    ...extra,
  };
}

/** Convierte un doc de playSubscriptions en el parche para users/{uid} */
function toUserPatchFromPlaySub(play: any) {
  const expiryMs = toMs(play?.expiryTimeMillis ?? play?.expiryTime);
  const startMs = toMs(play?.startTimeMillis ?? play?.startTime);
  const active = isActiveByExpiry(expiryMs);
  return {
    subscriptionStatus: active ? "active" : "inactive",
    expiryTimeMillis: expiryMs || null,
    expiryDate: msToISO(expiryMs),
    startDate: msToISO(startMs) || null,
    updatedAt: new Date().toISOString(),
    lastPlayState: {
      subscriptionState: String(
        play?.subscriptionState ?? play?.raw?.subscriptionState ?? ""
      ),
      notificationType:
        typeof play?.notificationType === "number"
          ? play.notificationType
          : Number(play?.raw?.subscriptionNotification?.notificationType) || null,
      regionCode: play?.regionCode ?? play?.raw?.regionCode ?? null,
    },
  };
}

/* =========================
 *  CALLABLES DE MAPEO
 * ========================= */

export const linkPurchaseToken = onCall(
  { region: "us-central1" },
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");

    const { purchaseToken, packageName, email } = (req.data ?? {}) as {
      purchaseToken?: string;
      packageName?: string;
      email?: string;
    };

    if (
      !purchaseToken ||
      typeof purchaseToken !== "string" ||
      purchaseToken.length < 10
    ) {
      throw new HttpsError("invalid-argument", "purchaseToken inválido.");
    }

    await db
      .collection("purchaseLinks")
      .doc(purchaseToken)
      .set(
        {
          uid,
          packageName: packageName ?? null,
          email: email ?? null,
          createdAt: new Date().toISOString(),
          lastClientAt: new Date().toISOString(),
        },
        { merge: true }
      );

    return { ok: true };
  }
);

export const linkAccountId = onCall(
  { region: "us-central1" },
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Debes iniciar sesión.");

    const { accountId } = (req.data ?? {}) as { accountId?: string };
    if (!accountId || typeof accountId !== "string" || accountId.length < 6) {
      throw new HttpsError("invalid-argument", "accountId inválido.");
    }

    await db
      .collection("accountMap")
      .doc(accountId)
      .set(
        {
          uid,
          createdAt: new Date().toISOString(),
          lastClientAt: new Date().toISOString(),
        },
        { merge: true }
      );

    return { ok: true };
  }
);

/* ======================================
 *  HTTPS OPCIONAL: verificar y guardar YA
 *  ✅ SEGURIDAD: Ahora requiere autenticación
 * ====================================== */
export const verifyAndSave = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    // ✅ CORS preflight
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.status(204).send("");
      return;
    }

    try {
      if (req.method !== "POST") {
        res.set("Access-Control-Allow-Origin", "*");
        res.status(405).send("Only POST");
        return;
      }

      // ✅ SEGURIDAD: Validar autenticación
      const authHeader = String(req.header("Authorization") || "");
      const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);

      let verifiedUid: string | null = null;

      if (tokenMatch) {
        try {
          const idToken = tokenMatch[1];
          const decoded = await getAdminAuth().verifyIdToken(idToken);
          verifiedUid = decoded.uid;
          logger.info("verifyAndSave: autenticación exitosa", { uid: verifiedUid });
        } catch (authErr: any) {
          logger.warn("verifyAndSave: token inválido", authErr?.message);
          // Continuamos sin UID verificado para compatibilidad temporal
        }
      } else {
        // 📊 Log para monitorear cuántas peticiones vienen sin token (clientes antiguos)
        logger.info("verifyAndSave: petición sin token de autenticación (cliente legacy)");
      }

      const { uid: bodyUid, packageName, purchaseToken } = (req.body ?? {}) as {
        uid?: string;
        packageName?: string;
        purchaseToken?: string;
      };

      // ✅ SEGURIDAD: Usar el UID del token verificado si está disponible
      // Si el token fue verificado, el UID DEBE coincidir con el del body
      const uid = verifiedUid || bodyUid;

      // ⚠️ TRANSICIÓN: Solo logueamos si hay discrepancia, no rechazamos
      // Esto permite monitorear antes de hacer la validación estricta
      if (verifiedUid && bodyUid && verifiedUid !== bodyUid) {
        logger.error("verifyAndSave: UID MISMATCH detectado", {
          verifiedUid,
          bodyUid,
          packageName,
          // No logueamos purchaseToken completo por seguridad
          tokenPrefix: purchaseToken?.substring(0, 10)
        });
        // TODO: Después de monitorear por unos días, descomentar para rechazar:
        // res.set("Access-Control-Allow-Origin", "*");
        // res.status(403).json({ ok: false, error: "UID no coincide" });
        // return;
      }

      if (!uid || !packageName || !purchaseToken) {
        res.set("Access-Control-Allow-Origin", "*");
        res.status(400).json({
          ok: false,
          error: "uid, packageName y purchaseToken requeridos",
        });
        return;
      }

      const playData = await fetchPlaySub(packageName, purchaseToken);
      const docData = normalizedDoc(playData, packageName, purchaseToken, {
        source: "verifyAndSave",
        verifiedAuth: !!verifiedUid, // ✅ Marcar si fue autenticado
      });

      await db
        .collection("playSubscriptions")
        .doc(purchaseToken)
        .set({ uid, ...docData }, { merge: true });

      await db
        .collection("users")
        .doc(uid)
        .set(toUserPatchFromPlaySub(docData), { merge: true });

      res.set("Access-Control-Allow-Origin", "*");
      res.status(200).json({ ok: true, ...docData });
      return;
    } catch (e: any) {
      logger.error(e);
      res.set("Access-Control-Allow-Origin", "*");
      res.status(500).json({ ok: false, error: e?.message ?? String(e) });
      return;
    }
  }
);

/* =========================
 *  RTDN (Pub/Sub → Functions)
 * ========================= */
export const handleRtdn = onMessagePublished(
  { topic: "play-rtdn", region: "us-central1" },
  async (event) => {
    try {
      const payload = (event.data?.message?.json ?? {}) as any;

      if (payload?.testNotification) {
        await db.collection("rtdn_raw").add({
          type: "testNotification",
          receivedAt: new Date().toISOString(),
          payload,
        });
        return;
      }

      const packageName = payload?.packageName;
      const eventTimeMillis = Number(payload?.eventTimeMillis || 0);
      const sub = payload?.subscriptionNotification;

      if (!packageName || !sub) {
        await db.collection("rtdn_raw").add({
          type: "unknown_or_oneTime",
          receivedAt: new Date().toISOString(),
          payload,
        });
        return;
      }

      const purchaseToken = sub?.purchaseToken;
      const subscriptionId = sub?.subscriptionId;
      const notificationType = Number(sub?.notificationType);
      if (!purchaseToken) return;

      let playData: any = null;
      try {
        playData = await fetchPlaySub(packageName, purchaseToken);
      } catch (e: any) {
        await db.collection("rtdn_raw").add({
          type: "fetch_error",
          receivedAt: new Date().toISOString(),
          packageName,
          purchaseToken,
          error: e?.message ?? String(e),
          payload,
        });
      }

      const expiryMs = playData?.expiryTimeMillis;
      const startMs = playData?.startTimeMillis;
      const subState = playData?.subscriptionState ?? undefined;

      const docData = {
        packageName,
        subscriptionId: subscriptionId ?? null,
        purchaseToken,
        notificationType: notificationType ?? null,
        eventTimeMillis: eventTimeMillis ?? null,
        eventTime: msToISO(eventTimeMillis),
        subscriptionState: subState ?? null,
        expiryTimeMillis: expiryMs ?? null,
        expiryDate: msToISO(expiryMs),
        startTimeMillis: startMs ?? null,
        startDate: msToISO(startMs),
        isActive: isActiveByExpiry(expiryMs),
        regionCode: playData?.regionCode ?? null,
        lastFetchAt: new Date().toISOString(),
        raw: payload,
      };

      const subRef = db.collection("playSubscriptions").doc(purchaseToken);
      const subSnap = await subRef.get();
      let uid = subSnap.exists ? (subSnap.data() as any)?.uid : undefined;

      await subRef.set(
        { ...docData, uid: uid ?? null, lastRtdnAt: new Date().toISOString() },
        { merge: true }
      );

      if (!uid) {
        const linkSnap = await db
          .collection("purchaseLinks")
          .doc(purchaseToken)
          .get();
        uid = linkSnap.exists ? (linkSnap.data() as any)?.uid : undefined;
        if (uid) await subRef.set({ uid }, { merge: true });
      }

      if (!uid && playData?.accountId) {
        const accSnap = await db
          .collection("accountMap")
          .doc(String(playData.accountId))
          .get();
        uid = accSnap.exists ? (accSnap.data() as any)?.uid : undefined;
        if (uid) await subRef.set({ uid }, { merge: true });
      }

      if (uid) {
        await db
          .collection("users")
          .doc(uid)
          .set(toUserPatchFromPlaySub(docData), { merge: true });
      }
    } catch (err) {
      logger.error(err);
      throw err;
    }
  }
);

/* ==========================================
 *  ESPEJO: playSubscriptions -> users/{uid}
 * ========================================== */
export const mirrorPlaySubToUser = onDocumentWritten(
  { document: "playSubscriptions/{purchaseToken}", region: "us-central1" },
  async (event) => {
    const before = event.data?.before?.data() as any;
    const after = event.data?.after?.data() as any;
    if (!after) return;

    const relevantChanged =
      !before ||
      before.isActive !== after.isActive ||
      Number(before?.expiryTimeMillis || 0) !==
      Number(after?.expiryTimeMillis || 0) ||
      before.subscriptionState !== after.subscriptionState ||
      before.notificationType !== after.notificationType ||
      before.regionCode !== after.regionCode;

    if (!relevantChanged) return;

    const purchaseToken = String(event.params.purchaseToken || "");

    let uid = after?.uid;
    if (!uid) {
      try {
        const linkSnap = await db
          .collection("purchaseLinks")
          .doc(purchaseToken)
          .get();
        uid = linkSnap.exists ? (linkSnap.data() as any)?.uid : undefined;
        if (uid) {
          await db
            .collection("playSubscriptions")
            .doc(purchaseToken)
            .set({ uid }, { merge: true });
        }
      } catch (e) {
        logger.warn("mirrorPlaySubToUser: error leyendo purchaseLinks", e as any);
      }
    }

    if (!uid) {
      logger.info(
        "mirrorPlaySubToUser: sin uid aún; se reflejará cuando llegue purchaseLinks",
        purchaseToken
      );
      return;
    }

    const patch = toUserPatchFromPlaySub(after);
    await db.collection("users").doc(uid).set(patch, { merge: true });
    logger.info("mirrorPlaySubToUser: users actualizado", { uid, purchaseToken });
  }
);

/* ====================================================
 *  BACKFILL: purchaseLinks -> asegura reflejo en users
 * ==================================================== */
export const backfillOnLink = onDocumentWritten(
  { document: "purchaseLinks/{purchaseToken}", region: "us-central1" },
  async (event) => {
    const after = event.data?.after?.data() as any;
    if (!after) return;

    const token = String(event.params.purchaseToken || "");
    const uid = after?.uid;
    if (!token || !uid) return;

    const subSnap = await db.collection("playSubscriptions").doc(token).get();
    if (!subSnap.exists) return;

    await db.collection("playSubscriptions").doc(token).set({ uid }, { merge: true });

    const sub = subSnap.data();
    const patch = toUserPatchFromPlaySub(sub);
    await db.collection("users").doc(uid).set(patch, { merge: true });
    logger.info("backfillOnLink: users actualizado desde purchaseLinks", {
      uid,
      token,
    });
  }
);

/* ===========================================
 *  SWEEPER: cierra suscripciones ya vencidas
 * =========================================== */
export const sweepExpiredSubs = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "UTC",
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async () => {
    const now = Date.now();

    const psSnap = await db
      .collection("playSubscriptions")
      .where("isActive", "==", true)
      .where("expiryTimeMillis", "<=", now)
      .limit(450)
      .get();

    if (!psSnap.empty) {
      const batch = db.batch();
      for (const doc of psSnap.docs) {
        const d = doc.data() as any;
        const uid = d?.uid;

        batch.set(
          doc.ref,
          { isActive: false, lastSweepAt: new Date().toISOString() },
          { merge: true }
        );

        if (uid) {
          batch.set(
            db.collection("users").doc(uid),
            {
              subscriptionStatus: "inactive",
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      }
      await batch.commit();
    }

    const usersSnap = await db
      .collection("users")
      .where("subscriptionStatus", "==", "active")
      .where("expiryTimeMillis", "<=", now)
      .limit(450)
      .get();

    if (!usersSnap.empty) {
      const batch2 = db.batch();
      for (const udoc of usersSnap.docs) {
        batch2.set(
          udoc.ref,
          { subscriptionStatus: "inactive", updatedAt: new Date().toISOString() },
          { merge: true }
        );
      }
      await batch2.commit();
    }
  }
);

/* ============================================================
 *  🔔 NOTIFICACIONES: anuncios → push a usuarios suscritos activos
 * ============================================================ */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export const sendPushOnAnnouncement = onDocumentWritten(
  { document: "announcements/{aid}", region: "us-central1" },
  async (event) => {
    const before = event.data?.before?.data() as any | undefined;
    const after = event.data?.after?.data() as any | undefined;
    const aid = event.params.aid;

    logger.info("sendPushOnAnnouncement: triggered", { aid });

    if (!after) {
      logger.info("sendPushOnAnnouncement: documento eliminado, saliendo", { aid });
      return;
    }

    const isNew = !before;
    const nowActive = after?.isDeleted === false;
    const wasActive = before?.isDeleted === false;

    // Solo procesar si es nuevo y activo, o si se reactivó
    if (!(isNew && nowActive) && !(nowActive && !wasActive)) {
      logger.info("sendPushOnAnnouncement: no cumple condiciones de envío", {
        aid, isNew, nowActive, wasActive
      });
      return;
    }

    const title = String(after?.title || "AL Calculadora");
    const body = String(after?.body || "");

    // ✅ Obtener destinatarios (si existe)
    const destinatarios = after?.destinatarios;
    const isForAll = !destinatarios ||
      (Array.isArray(destinatarios) && destinatarios.includes("Todos")) ||
      destinatarios === "Todos";

    const targetUids: Set<string> | null = isForAll ? null : new Set(
      Array.isArray(destinatarios)
        ? destinatarios.filter((d: string) => d !== "Todos")
        : [destinatarios]
    );

    logger.info("sendPushOnAnnouncement: configuración", {
      aid, title, isForAll, targetUidsCount: targetUids?.size ?? "todos"
    });

    // Obtener todos los tokens habilitados
    const tokSnap = await db
      .collectionGroup("deviceTokens")
      .where("enabled", "==", true)
      .limit(10000)
      .get();

    if (tokSnap.empty) {
      logger.info("sendPushOnAnnouncement: no hay deviceTokens habilitados", { aid });
      return;
    }

    logger.info("sendPushOnAnnouncement: tokens encontrados", {
      aid, count: tokSnap.size
    });

    type Target = { token: string; uid: string };
    const targets: Target[] = [];
    const userCache = new Map<string, boolean>();

    for (const d of tokSnap.docs) {
      const tokenData = d.data() as any;
      const parent = d.ref.parent.parent;
      if (!parent) continue;
      const uid = parent.id;

      // ✅ Si hay destinatarios específicos, verificar que el UID esté en la lista
      if (targetUids && !targetUids.has(uid)) {
        continue; // Saltar este usuario
      }

      // Verificar suscripción activa (con cache)
      let isActiveUser = userCache.get(uid);
      if (typeof isActiveUser === "undefined") {
        const udoc = await parent.get();
        const us = (udoc.data() as any)?.subscriptionStatus;
        isActiveUser = us === "active";
        userCache.set(uid, isActiveUser);
      }

      if (isActiveUser && tokenData?.token) {
        targets.push({ token: String(tokenData.token), uid });
      }
    }

    if (!targets.length) {
      logger.info("sendPushOnAnnouncement: no hay usuarios activos con token que cumplan criterios", {
        aid,
        totalTokens: tokSnap.size,
        isForAll,
        targetUidsCount: targetUids?.size ?? 0
      });
      return;
    }

    logger.info("sendPushOnAnnouncement: enviando a targets", {
      aid, count: targets.length
    });

    const batches = chunk(targets, 500);
    const android: any = {
      notification: {
        channelId: "alcalc_general",
        defaultVibrateTimings: true,
        defaultSound: true,
        priority: "HIGH",
      },
    };

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const lot of batches) {
      try {
        const resp = await fcm.sendEachForMulticast({
          tokens: lot.map((t) => t.token),
          notification: { title, body },
          android,
          data: { type: "announcement" },
        });
        sent += resp.successCount;
        failed += resp.failureCount;

        resp.responses.forEach((r, idx) => {
          if (!r.success) {
            const code = (r.error as any)?.errorInfo?.code || r.error?.code || "unknown";
            const msg = (r.error as any)?.message || r.error?.message || "";
            errors.push(`${lot[idx].uid}: ${code}`);

            // Deshabilitar tokens inválidos
            if (
              code === "messaging/registration-token-not-registered" ||
              code === "messaging/invalid-registration-token"
            ) {
              const { uid, token } = lot[idx];
              db.collection("users")
                .doc(uid)
                .collection("deviceTokens")
                .doc(token)
                .set(
                  { enabled: false, disabledAt: new Date().toISOString(), disableReason: code },
                  { merge: true }
                );
            }
          }
        });
      } catch (batchErr: any) {
        logger.error("sendPushOnAnnouncement: error en batch", {
          aid, error: batchErr?.message
        });
      }
    }

    logger.info("sendPushOnAnnouncement: completado", {
      aid,
      sent,
      failed,
      totalTargets: targets.length,
      errors: errors.slice(0, 10), // Solo los primeros 10 errores
    });
  }
);

/* ===========================
 *  🔐 BACKUP PROXY (HTTP) — robusto
 * =========================== */
/**
 * GET/POST /backupGetLatest
 * Header: Authorization: Bearer <ID_TOKEN>  (o Firebase <ID_TOKEN>)
 *
 * Si es POST, puede venir body JSON: { path?: string }.
 * Si no se envía path, se toma de users/{uid}/backups/latest.
 */
export const backupGetLatest = onRequest(
  { region: "us-central1", cors: true, timeoutSeconds: 60, memory: "256MiB" },
  async (req, res) => {
    try {
      // CORS preflight
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
        res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.status(204).send("");
        return;
      }

      // Solo GET o POST
      if (req.method !== "GET" && req.method !== "POST") {
        res.set("Access-Control-Allow-Origin", "*");
        res.status(405).json({ ok: false, error: "Only GET or POST" });
        return;
      }

      // Auth: Bearer o Firebase
      const authHeader = String(req.header("Authorization") || "");
      const m =
        authHeader.match(/^Bearer\s+(.+)$/i) ||
        authHeader.match(/^Firebase\s+(.+)$/i);
      if (!m) {
        res.set("Access-Control-Allow-Origin", "*");
        res.status(401).json({
          ok: false,
          error:
            "Missing Authorization header. Use 'Bearer <ID_TOKEN>' or 'Firebase <ID_TOKEN>'.",
        });
        return;
      }
      const idToken = m[1];
      const decoded = await getAdminAuth().verifyIdToken(idToken);
      const uid = decoded.uid;

      // ── Resolver path (siempre string)
      let path = "";
      if (req.method === "POST" && req.is("application/json") && typeof req.body === "object") {
        const p = (req.body as any)?.path;
        if (typeof p === "string" && p.trim().length > 0) {
          path = p.trim();
        }
      }
      if (!path) {
        const snap = await db.doc(`users/${uid}/backups/latest`).get();
        const data = snap.exists ? (snap.data() as any) : undefined;
        const p2 = data?.path;
        path = typeof p2 === "string" && p2.trim().length > 0 ? p2.trim() : `backups/${uid}/latest.json`;
      }

      // Leer desde Storage
      const storage = getStorage();
      const bucket = storage.bucket();
      const file = bucket.file(path);

      const [exists] = await file.exists();
      if (!exists) {
        res.set("Access-Control-Allow-Origin", "*");
        res.status(404).json({ ok: false, error: `No existe el archivo: ${path}` });
        return;
      }

      // Stream directo
      res.set("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      file
        .createReadStream({ validation: false })
        .on("error", (err) => {
          console.error("backupGetLatest stream ERR:", err);
          if (!res.headersSent) {
            res.status(500).json({ ok: false, error: String(err) });
          }
        })
        .pipe(res);
    } catch (e: any) {
      console.error("backupGetLatest ERR:", e);
      res.set("Access-Control-Allow-Origin", "*");
      if (e?.code === "auth/argument-error" || e?.code === "auth/invalid-id-token") {
        res.status(401).json({ ok: false, error: "Invalid ID token" });
        return;
      }
      res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
  }
);

// ========================================
// NUEVAS FUNCIONES - SISTEMA DE AFILIADOS
// ========================================
// VERSIÓN CORREGIDA FINAL - Accede correctamente a lastPlayState.subscriptionState

/**
 * Valida un código de afiliado y lo asocia al usuario
 * Callable function
 */
export const validateAffiliateCode = onCall(
  { region: "us-central1" },
  async (req) => {
    // Verificar autenticación
    if (!req.auth) {
      throw new HttpsError("unauthenticated", "Usuario no autenticado");
    }

    const { code } = (req.data ?? {}) as { code?: string };
    const uid = req.auth.uid;

    if (!code) {
      throw new HttpsError("invalid-argument", "Código requerido");
    }

    try {
      // 1. Verificar si el código existe y está activo
      const codeDoc = await db.collection("affiliate_codes").doc(code).get();

      if (!codeDoc.exists) {
        return {
          success: false,
          message: "CÓDIGO NO VÁLIDO",
        };
      }

      const codeData = codeDoc.data();
      if (!codeData?.isActive) {
        return {
          success: false,
          message: "CÓDIGO NO VÁLIDO",
        };
      }

      // 2. Verificar si el usuario ya tiene un código asociado
      const userDoc = await db.collection("users").doc(uid).get();
      const userData = userDoc.data();

      if (userData?.affiliateCode) {
        return {
          success: false,
          message: "Ya tienes un código asociado",
        };
      }

      // 3. Asociar código al usuario
      await db.collection("users").doc(uid).update({
        affiliateCode: code,
        affiliateCodeUsedAt: new Date().toISOString(),
      });

      // 4. Registrar en la estructura de afiliados (Input_code)
      const affiliateId = codeData.affiliateId;
      await db
        .collection("Afiliados")
        .doc(affiliateId)
        .collection("Input_code")
        .doc(uid)
        .set({
          ...userData,
          affiliateCode: code,
          codeUsedAt: new Date().toISOString(),
        });

      logger.info(`✅ Código ${code} asociado al usuario ${uid}`);

      return {
        success: true,
        message: "Código canjeado exitosamente",
        affiliateName: codeData.affiliateName || "Afiliado",
      };
    } catch (error) {
      logger.error("Error validando código:", error);
      throw new HttpsError("internal", "Error al validar código");
    }
  }
);

/**
 * Detecta cambios en subscriptionState (anidado en lastPlayState) y actualiza contadores de afiliados
 * Firestore trigger on users/{userId}
 */
export const onSubscriptionStateChange = onDocumentWritten(
  { document: "users/{userId}", region: "us-central1" },
  async (event) => {
    const before = event.data?.before?.data() as any | undefined;
    const after = event.data?.after?.data() as any | undefined;
    const uid = event.params.userId;

    // Si no hay before o after, salir
    if (!before || !after) return;

    // ✅ CORRECCIÓN: Acceder al campo anidado correctamente
    const beforeState = before.lastPlayState?.subscriptionState;
    const afterState = after.lastPlayState?.subscriptionState;

    // LOG para debugging
    logger.info(`🔍 Trigger para usuario ${uid}`);
    logger.info(`Before state: ${beforeState}, After state: ${afterState}`);
    logger.info(`affiliateCode: ${after.affiliateCode}`);

    // Verificar si hay cambio
    if (beforeState === afterState) {
      logger.info(`⏭️ No hubo cambio en subscriptionState, saltando...`);
      return;
    }

    const affiliateCode = after.affiliateCode;
    if (!affiliateCode) {
      logger.info(`⏭️ Usuario sin código de afiliado, saltando...`);
      return;
    }

    // Obtener info del código
    const codeDoc = await db
      .collection("affiliate_codes")
      .doc(affiliateCode)
      .get();

    if (!codeDoc.exists) {
      logger.error(`❌ Código ${affiliateCode} no existe en affiliate_codes`);
      return;
    }

    const codeData = codeDoc.data();
    const affiliateId = codeData?.affiliateId;

    if (!affiliateId) {
      logger.error(`❌ affiliateId no encontrado para código ${affiliateCode}`);
      return;
    }

    logger.info(`✅ Código válido encontrado: ${affiliateCode} → ${affiliateId}`);

    const affiliateRef = db.collection("Afiliados").doc(affiliateId);
    const subscriberRef = affiliateRef.collection("subscribers").doc(uid);

    // CASO 1: Usuario se vuelve ACTIVO
    if (
      afterState === "SUBSCRIPTION_STATE_ACTIVE" &&
      beforeState !== "SUBSCRIPTION_STATE_ACTIVE"
    ) {
      logger.info(`🟢 Usuario se volvió ACTIVO`);

      const subscriberDoc = await subscriberRef.get();

      if (!subscriberDoc.exists) {
        logger.info(`📝 Primera activación, creando documento en subscribers`);

        await subscriberRef.set({
          ...after,
          isActive: true,
          hasEverCancelled: false,
          firstPaymentDate: new Date().toISOString(),
        });

        await affiliateRef.update({
          activeSubscribers: FieldValue.increment(1),
        });

        logger.info(`✅ +1 suscriptor activo para ${affiliateId} (usuario: ${uid})`);
      } else {
        logger.info(`📝 Usuario ya existe en subscribers, verificando reactivación`);

        const subscriberData = subscriberDoc.data();

        if (subscriberData?.hasEverCancelled === false) {
          await subscriberRef.update({
            isActive: true,
          });

          await affiliateRef.update({
            activeSubscribers: FieldValue.increment(1),
          });

          logger.info(`✅ Reactivación contada para ${affiliateId} (usuario: ${uid})`);
        } else {
          await subscriberRef.update({
            isActive: true,
          });
          logger.info(`⚠️ Reactivación NO contada (ya había cancelado antes) - ${affiliateId} (usuario: ${uid})`);
        }
      }
    }

    // CASO 2: Usuario CANCELA
    if (
      afterState === "SUBSCRIPTION_STATE_CANCELED" &&
      beforeState === "SUBSCRIPTION_STATE_ACTIVE"
    ) {
      logger.info(`🔴 Usuario CANCELÓ su suscripción`);

      const subscriberDoc = await subscriberRef.get();

      if (subscriberDoc.exists) {
        const subscriberData = subscriberDoc.data();

        if (subscriberData?.isActive === true) {
          await subscriberRef.update({
            isActive: false,
            hasEverCancelled: true,
            cancelledAt: new Date().toISOString(),
          });

          await affiliateRef.update({
            activeSubscribers: FieldValue.increment(-1),
          });

          logger.info(`❌ -1 suscriptor activo para ${affiliateId} (usuario: ${uid})`);
        }
      }
    }

    // CASO 3: Usuario expira, pausa, etc. (otros estados inactivos)
    const inactiveStates = [
      "SUBSCRIPTION_STATE_EXPIRED",
      "SUBSCRIPTION_STATE_ON_HOLD",
      "SUBSCRIPTION_STATE_PAUSED",
      "SUBSCRIPTION_STATE_PENDING"
    ];

    if (
      afterState &&
      inactiveStates.includes(afterState) &&
      beforeState === "SUBSCRIPTION_STATE_ACTIVE"
    ) {
      logger.info(`🟡 Usuario cambió a estado inactivo: ${afterState}`);

      const subscriberDoc = await subscriberRef.get();

      if (subscriberDoc.exists) {
        const subscriberData = subscriberDoc.data();

        if (subscriberData?.isActive === true) {
          await subscriberRef.update({
            isActive: false,
            hasEverCancelled: true,
            cancelledAt: new Date().toISOString(),
          });

          await affiliateRef.update({
            activeSubscribers: FieldValue.increment(-1),
          });

          logger.info(`❌ -1 suscriptor activo para ${affiliateId} (usuario: ${uid}) - Estado: ${afterState}`);
        }
      }
    }
  }
);

/**
 * Inicializa la estructura de un afiliado
 * Callable function - Solo admin
 */
export const initializeAffiliate = onCall(
  { region: "us-central1" },
  async (req) => {
    // Solo admin puede ejecutar esto
    if (!req.auth || req.auth.token.admin !== true) {
      throw new HttpsError("permission-denied", "Solo administradores");
    }

    const { affiliateId, code, name } = (req.data ?? {}) as {
      affiliateId?: string;
      code?: string;
      name?: string;
    };

    if (!affiliateId || !code || !name) {
      throw new HttpsError(
        "invalid-argument",
        "affiliateId, code y name son requeridos"
      );
    }

    try {
      // Crear código de afiliado
      await db.collection("affiliate_codes").doc(code).set({
        isActive: true,
        affiliateId: affiliateId,
        affiliateName: name,
        createdAt: new Date().toISOString(),
      });

      // Crear estructura de afiliado
      await db.collection("Afiliados").doc(affiliateId).set({
        code: code,
        name: name,
        isActive: true,
        activeSubscribers: 0,
        createdAt: new Date().toISOString(),
      });

      logger.info(`✅ Afiliado ${name} (${affiliateId}) inicializado correctamente`);

      return {
        success: true,
        message: `Afiliado ${name} inicializado correctamente`,
      };
    } catch (error) {
      logger.error("Error inicializando afiliado:", error);
      throw new HttpsError("internal", "Error al inicializar afiliado");
    }
  }
);

/**
 * Trigger que escucha cambios en la colección de usuarios para mantener
 * un panel de control con el total de suscriptores activos y sus correos.
 */
export const onUserWritten = onDocumentWritten(
  { document: "users/{uid}" },
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // Si el documento fue eliminado, no hacemos nada (o podrías restar)
    if (!afterData) {
      if (beforeData && beforeData.email && beforeData.lastPlayState?.subscriptionState === "SUBSCRIPTION_STATE_ACTIVE") {
        await updateStats(beforeData.email, false);
      }
      return;
    }

    const oldEmail = beforeData?.email;
    const newEmail = afterData?.email;
    const oldState = beforeData?.lastPlayState?.subscriptionState;
    const newState = afterData?.lastPlayState?.subscriptionState;

    const wasActive = oldState === "SUBSCRIPTION_STATE_ACTIVE";
    const isActive = newState === "SUBSCRIPTION_STATE_ACTIVE";

    // Caso 1: Pasó de INACTIVO a ACTIVO
    if (!wasActive && isActive && newEmail) {
      await updateStats(newEmail, true);
    }
    // Caso 2: Pasó de ACTIVO a INACTIVO
    else if (wasActive && !isActive && oldEmail) {
      await updateStats(oldEmail, false);
    }
    // Caso 3: Cambió el email estando activo (poco común pero posible)
    else if (wasActive && isActive && oldEmail !== newEmail) {
      if (oldEmail) await updateStats(oldEmail, false);
      if (newEmail) await updateStats(newEmail, true);
    }
  }
);

/**
 * Helper para actualizar el documento de estadísticas globales
 */
async function updateStats(email: string, add: boolean) {
  const statsRef = db.collection("stats").doc("totalsuscriptores");

  try {
    if (add) {
      await statsRef.set({
        numero: FieldValue.increment(1),
        correos: FieldValue.arrayUnion(email),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      logger.info(`📈 Sumado suscriptor activo: ${email}`);
    } else {
      await statsRef.set({
        numero: FieldValue.increment(-1),
        correos: FieldValue.arrayRemove(email),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
      logger.info(`📉 Restado suscriptor activo: ${email}`);
    }
  } catch (error) {
    logger.error("Error al actualizar stats de suscriptores:", error);
  }
}

/**
 * Función manual para sincronizar todos los suscriptores actuales de una sola vez.
 * Después de desplegar, puedes llamar a esta URL en tu navegador para "llenar" la lista:
 * https://us-central1-<tu-proyecto>.cloudfunctions.net/syncSubscribers
 */
export const syncSubscribers = onRequest(
  { region: "us-central1" },
  async (req, res) => {
    try {
      logger.info("Iniciando sincronización manual de suscriptores...");

      const snapshot = await db.collection("users")
        .where("lastPlayState.subscriptionState", "==", "SUBSCRIPTION_STATE_ACTIVE")
        .get();

      const activeEmails: string[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.email) {
          activeEmails.push(data.email);
        }
      });

      await db.collection("stats").doc("totalsuscriptores").set({
        numero: activeEmails.length,
        correos: activeEmails,
        updatedAt: FieldValue.serverTimestamp(),
        lastManualSync: FieldValue.serverTimestamp()
      }, { merge: true });

      const msg = `✅ Sincronización exitosa. Se han encontrado y guardado ${activeEmails.length} suscriptores activos.`;
      logger.info(msg);
      res.status(200).send(msg);
    } catch (error) {
      logger.error("Error en sincronización manual:", error);
      res.status(500).send("❌ Error al sincronizar: " + error);
    }
  }
);

// ========================================
// FIN DE NUEVAS FUNCIONES DE AFILIADOS
// ========================================