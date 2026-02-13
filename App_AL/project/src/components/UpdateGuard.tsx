// src/components/UpdateGuard.tsx
import React, { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { AppUpdate } from "@capawesome/capacitor-app-update";
import { getFirestore, doc, getDoc } from "firebase/firestore";

/**
 * UpdateGuard (con política remota + caché offline)
 * - Comprueba updates al arrancar y al volver a foreground (Android/Play).
 * - Política dinámica via Firestore (con fallback y cache localStorage).
 * - Flexible para “recomendadas”. Immediate para “críticas” SIN plan B.
 * - Si el forzado es cancelado/falla, mostramos overlay bloqueante.
 */

type UpdateInfo = {
  updateAvailability?: number; // 0..3 (2 = UPDATE_AVAILABLE, 3 = IN_PROGRESS)
  installStatus?: number;      // 11 = DOWNLOADED
  immediateUpdateAllowed?: boolean;
  flexibleUpdateAllowed?: boolean;
  availableVersionCode?: number;
};

type UpdatePolicy = {
  minRecommendedVersionCode: number; // dispara flexible (banner)
  minCriticalVersionCode: number;    // fuerza immediate
  message?: string | null;
};

// Constantes nativas de Play Core
const UPDATE_AVAILABLE = 2;
const DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS = 3;
const INSTALL_STATUS_DOWNLOADED = 11;

// Fallbacks que pediste
const FALLBACK_POLICY: UpdatePolicy = {
  minRecommendedVersionCode: 156,
  minCriticalVersionCode: 200,
  message: "Hay una versión nueva disponible.",
};

// Caché en localStorage
const POLICY_LS_KEY = "alcalc.updatePolicy.v1";

// Checar máx. 1 vez/minuto
const CHECK_COOLDOWN_MS = 60_000;

const isAndroidPlayEnv = () => Capacitor.getPlatform() === "android";

function readCachedPolicy(): UpdatePolicy {
  try {
    const raw = localStorage.getItem(POLICY_LS_KEY);
    if (!raw) return FALLBACK_POLICY;
    const obj = JSON.parse(raw) as Partial<UpdatePolicy>;
    return {
      minRecommendedVersionCode:
        typeof obj.minRecommendedVersionCode === "number"
          ? obj.minRecommendedVersionCode
          : FALLBACK_POLICY.minRecommendedVersionCode,
      minCriticalVersionCode:
        typeof obj.minCriticalVersionCode === "number"
          ? obj.minCriticalVersionCode
          : FALLBACK_POLICY.minCriticalVersionCode,
      message: typeof obj.message === "string" ? obj.message : FALLBACK_POLICY.message,
    };
  } catch {
    return FALLBACK_POLICY;
  }
}

function writeCachedPolicy(p: UpdatePolicy) {
  try {
    localStorage.setItem(POLICY_LS_KEY, JSON.stringify(p));
  } catch {}
}

async function fetchPolicyFromFirestore(): Promise<UpdatePolicy | null> {
  try {
    const db = getFirestore();
    const ref = doc(db, "config", "appUpdate");
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const d = snap.data() as any;
    const minRec = Number(d?.minRecommendedVersionCode);
    const minCrit = Number(d?.minCriticalVersionCode);
    const message =
      typeof d?.message === "string" && d.message.trim() ? String(d.message) : null;

    if (!Number.isFinite(minRec) || !Number.isFinite(minCrit)) return null;

    return {
      minRecommendedVersionCode: minRec,
      minCriticalVersionCode: minCrit,
      message,
    };
  } catch {
    return null;
  }
}

const UpdateGuard: React.FC = () => {
  const [policy, setPolicy] = useState<UpdatePolicy>(() => readCachedPolicy());
  const [appBuild, setAppBuild] = useState<number | null>(null);

  // UI
  const [showBanner, setShowBanner] = useState(false);   // flexible
  const [mustBlock, setMustBlock] = useState(false);     // crítico (overlay)
  const [checking, setChecking] = useState(false);

  const lastCheckRef = useRef<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Carga build instalado (versionCode) una vez
  useEffect(() => {
    (async () => {
      try {
        const info = await CapacitorApp.getInfo();
        const build = Number((info as any)?.build ?? 0);
        if (Number.isFinite(build) && build > 0) setAppBuild(build);
      } catch {}
    })();
  }, []);

  const refreshPolicy = async () => {
    const remote = await fetchPolicyFromFirestore();
    if (remote) {
      setPolicy(remote);
      writeCachedPolicy(remote);
    } else {
      setPolicy((p) => p || FALLBACK_POLICY);
    }
  };

  // Polling para flexible descargada
  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };
  const startPollingForDownloaded = () => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const info = (await AppUpdate.getAppUpdateInfo()) as unknown as UpdateInfo;
        if (info?.installStatus === INSTALL_STATUS_DOWNLOADED) {
          stopPolling();
          await AppUpdate.completeFlexibleUpdate(); // reinicia con nueva versión
        }
      } catch {
        stopPolling();
      }
    }, 1500);
  };

  const tryStartFlexibleUpdate = async () => {
    try {
      await AppUpdate.startFlexibleUpdate();
      startPollingForDownloaded();
    } catch {
      setShowBanner(false);
    }
  };

  const shouldForceImmediate = (installedCode: number, pol: UpdatePolicy) => {
    return installedCode > 0 && installedCode < pol.minCriticalVersionCode;
  };

  const checkForUpdates = async (force = false) => {
    if (!isAndroidPlayEnv()) return;

    // Asegurar build instalado
    let installed = appBuild;
    if (!installed) {
      try {
        const info = await CapacitorApp.getInfo();
        const build = Number((info as any)?.build ?? 0);
        if (Number.isFinite(build) && build > 0) installed = build;
        setAppBuild(installed ?? null);
      } catch {}
    }

    const now = Date.now();
    if (!force && now - lastCheckRef.current < CHECK_COOLDOWN_MS) return;
    lastCheckRef.current = now;

    setChecking(true);
    try {
      const info = (await AppUpdate.getAppUpdateInfo()) as unknown as UpdateInfo;

      // Flexible ya en progreso → continuar (no bloqueamos)
      if (info.updateAvailability === DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
        try {
          await AppUpdate.startFlexibleUpdate();
          startPollingForDownloaded();
        } catch {}
        setShowBanner(false);
        setMustBlock(false);
        return;
      }

      const hasUpdate = info.updateAvailability === UPDATE_AVAILABLE;
      if (!hasUpdate) {
        setShowBanner(false);
        setMustBlock(false);
        return;
      }

      // ---- CRÍTICO: Immediate SIN plan B ----
      if (installed && shouldForceImmediate(installed, policy)) {
        if (info.immediateUpdateAllowed) {
          // Intentamos immediate. Si vuelve o falla → bloquear overlay.
          try {
            await AppUpdate.performImmediateUpdate();
            // Si retorna, el usuario canceló.
            setMustBlock(true);
            setShowBanner(false);
          } catch {
            setMustBlock(true);
            setShowBanner(false);
          }
        } else {
          // Play no permite immediate para este rollout → bloqueamos y pedimos abrir Play.
          setMustBlock(true);
          setShowBanner(false);
        }
        return;
      }

      // ---- RECOMENDADA: Flexible con banner ----
      if (
        info.flexibleUpdateAllowed &&
        installed &&
        installed < policy.minRecommendedVersionCode
      ) {
        setShowBanner(true);
        setMustBlock(false);
      } else {
        setShowBanner(false);
        setMustBlock(false);
      }
    } finally {
      setChecking(false);
    }
  };

  // Arranque y resume
  useEffect(() => {
    refreshPolicy().finally(() => {
      checkForUpdates(true);
    });
    const sub = CapacitorApp.addListener("resume", async () => {
      await refreshPolicy();
      await checkForUpdates(false);
    });
    return () => {
      sub.remove();
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reintento del flujo immediate desde el overlay
  const retryImmediate = async () => {
    try {
      const info = (await AppUpdate.getAppUpdateInfo()) as unknown as UpdateInfo;
      if (info?.immediateUpdateAllowed) {
        await AppUpdate.performImmediateUpdate();
        // Si retorna, no se completó → mantener bloqueo
        setMustBlock(true);
      } else {
        setMustBlock(true);
      }
    } catch {
      setMustBlock(true);
    }
  };

  // Flexible banner
  if (showBanner) {
    return (
      <div
        style={{
          position: "fixed",
          left: 16,
          right: 16,
          bottom: 16,
          zIndex: 9999,
          background: "#111827",
          color: "#e5e7eb",
          borderRadius: 12,
          boxShadow: "0 10px 24px rgba(0,0,0,.35)",
          padding: "12px 14px",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Actualización disponible</div>
        <div style={{ fontSize: 14, lineHeight: 1.4, marginBottom: 10 }}>
          {policy.message ||
            "Hay una nueva versión en Google Play. Puedes seguir usando la app mientras se descarga."}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => setShowBanner(false)}
            style={{
              background: "transparent",
              border: "1px solid #374151",
              color: "#e5e7eb",
              padding: "8px 12px",
              borderRadius: 8,
              fontWeight: 700,
            }}
            disabled={checking}
          >
            Más tarde
          </button>
          <button
            onClick={() => tryStartFlexibleUpdate()}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: 0,
              padding: "8px 14px",
              borderRadius: 8,
              fontWeight: 800,
              minWidth: 120,
            }}
            disabled={checking}
          >
            Actualizar
          </button>
        </div>
      </div>
    );
  }

  // Overlay bloqueante para crítico SIN plan B
  if (mustBlock) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          background: "rgba(0,0,0,0.65)",
          display: "grid",
          placeItems: "center",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            width: "86%",
            maxWidth: 420,
            background: "#1f2937",
            color: "#e5e7eb",
            borderRadius: 14,
            padding: "18px 16px 14px",
            boxShadow: "0 14px 38px rgba(0,0,0,0.55)",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
            Actualización obligatoria
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.45, marginBottom: 16 }}>
            {policy.message ||
              "Por seguridad y compatibilidad debes actualizar a la última versión para continuar."}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={retryImmediate}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: 0,
                padding: "10px 14px",
                borderRadius: 10,
                fontWeight: 800,
                minWidth: 140,
              }}
              disabled={checking}
            >
              Actualizar ahora
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default UpdateGuard;
