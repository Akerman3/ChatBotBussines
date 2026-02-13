// src/hooks/useAutoBackup.ts
import { useEffect, useRef } from "react";
import { Preferences } from "@capacitor/preferences";
import { Network } from "@capacitor/network";
import { App as CapacitorApp } from "@capacitor/app";
import { runAutoBackupSilently } from "../services/autoBackup";

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h

const K_LAST = "backup.lastAt";     // number (epoch ms)
const K_NEXT = "backup.nextDueAt";  // number (epoch ms)
const K_PEND = "backup.pending";    // "true" | "false"

/** Lecturas/escrituras simples a Preferences */
async function getNum(key: string): Promise<number | undefined> {
  const { value } = await Preferences.get({ key });
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}
async function setNum(key: string, n: number) {
  await Preferences.set({ key, value: String(n) });
}
async function getBool(key: string): Promise<boolean> {
  const { value } = await Preferences.get({ key });
  return value === "true";
}
async function setBool(key: string, b: boolean) {
  await Preferences.set({ key, value: b ? "true" : "false" });
}

/**
 * Activa el respaldo automático silencioso:
 * - Intenta cuando vence (24h) o al volver la app / volver la red.
 * - Sin UI. Sin toasts. Con guard contra ejecuciones simultáneas.
 */
export function useAutoBackup() {
  const runningRef = useRef(false);
  const cooldownRef = useRef<number | null>(null);

  /** Evita doble ejecución si se disparan varios eventos juntos */
  const withGuard = async (fn: () => Promise<void>) => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      await fn();
    } finally {
      runningRef.current = false;
      // Pequeño cooldown para evitar repeticiones inmediatas
      if (cooldownRef.current) window.clearTimeout(cooldownRef.current);
      cooldownRef.current = window.setTimeout(() => {
        cooldownRef.current = null;
      }, 1500);
    }
  };

  /** Intenta el backup si ya toca o si hay pendiente y hay red */
  const maybeRun = async () => {
    await withGuard(async () => {
      const now = Date.now();
      let next = (await getNum(K_NEXT)) ?? 0;
      let pending = await getBool(K_PEND);

      // Si nunca se programó, que toque ahora
      if (!next) {
        await setNum(K_NEXT, now);
        next = now;
      }

      // ¿Hay internet?
      const status = await Network.getStatus();
      const online = !!status.connected;

      // ¿Ya venció o está pendiente?
      const due = now >= next;

      if (!online) {
        // Sin internet → marcar pendiente si ya toca
        if (due) await setBool(K_PEND, true);
        return;
      }

      if (pending || due) {
        const ok = await runAutoBackupSilently();
        if (ok) {
          await setNum(K_LAST, now);
          await setNum(K_NEXT, now + INTERVAL_MS);
          await setBool(K_PEND, false);
        } else {
          // Si falló (red u otro), dejar pendiente
          await setBool(K_PEND, true);
        }
      }
    });
  };

  useEffect(() => {
    // 1) Intento al montar (al entrar al MainMenu)
    void maybeRun();

    // 2) Intento cuando la app vuelve al primer plano
    const subApp = CapacitorApp.addListener("appStateChange", (s) => {
      if (s.isActive) void maybeRun();
    });

    // 3) Intento cuando vuelve la red
    const subNet = Network.addListener("networkStatusChange", (s) => {
      if (s.connected) void maybeRun();
    });

    // 4) Intento también en web cuando cambia visibilidad (por si desktop)
    const onVis = () => {
      if (document.visibilityState === "visible") void maybeRun();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      subApp.remove();
      subNet.remove();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
}
