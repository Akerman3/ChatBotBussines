// src/components/SubscriptionExpiryGuard.tsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

// ✅ Usar el storage centralizado por EMAIL
import {
  loadOfflineSubFor,
  isOfflineSubActive,
  OfflineSubState,
} from "../lib/offlineSubStorage";

// Rutas donde JAMÁS se debe activar el kick (arranque y flujo de alta)
const EXCLUDED_PATHS = new Set<string>([
  "/",          // StartupRouter
  "/home",
  "/login",
  "/signup",
  "/subscription",
]);

// Bandera para mostrar el aviso de expulsión en Home una sola vez
const KICK_FLAG = "alcalc.kickNotice";

// Clave del mapa en localStorage (para escuchar cambios vía 'storage')
const MAP_KEY = "alcalc.offlineSubMap.v2";

export default function SubscriptionExpiryGuard() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  const [user, setUser] = useState<User | null>(getAuth().currentUser);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mantener el usuario al día
  useEffect(() => {
    const auth = getAuth();
    const off = onAuthStateChanged(auth, setUser);
    return () => off();
  }, []);

  // Función que (re)programa la expulsión exacta
  const scheduleCheck = React.useCallback(() => {
    // Limpia timer previo
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // En rutas excluidas: no hacemos nada
    if (EXCLUDED_PATHS.has(pathname)) return;

    const email = user?.email ?? null;
    const info: OfflineSubState | null = loadOfflineSubFor(email);

    // Si no hay datos offline, no podemos decidir nada aquí
    if (!info) return;

    // Si YA no está activa (venció / cancelada / on_hold / etc.), chutamos al Home de inmediato
    if (!isOfflineSubActive(info)) {
      try {
        sessionStorage.setItem(
          KICK_FLAG,
          JSON.stringify({ expiryTimeMillis: info.expiryTimeMillis, label: info.label ?? "" })
        );
      } catch { }
      nav("/", { replace: true });
      return;
    }

    // Si está activa: programar kick al milisegundo exacto de vencimiento
    const now = Date.now();
    const remaining = info.expiryTimeMillis - now;

    // Por seguridad, si ya está vencida (carrera de ms), expulsar
    if (remaining <= 0) {
      try {
        sessionStorage.setItem(
          KICK_FLAG,
          JSON.stringify({ expiryTimeMillis: info.expiryTimeMillis, label: info.label ?? "" })
        );
      } catch { }
      nav("/", { replace: true });
      return;
    }

    const delay = Math.min(remaining, 0x7fffffff); // cap de setTimeout
    timerRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(
          KICK_FLAG,
          JSON.stringify({ expiryTimeMillis: info.expiryTimeMillis, label: info.label ?? "" })
        );
      } catch { }
      nav("/", { replace: true });
    }, delay);
  }, [pathname, user, nav]);

  // (Re)programar al montar y cuando cambien dependencias
  useEffect(() => {
    scheduleCheck();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleCheck]);

  // Revalidar al volver a primer plano (nativo)
  useEffect(() => {
    const sub = CapacitorApp.addListener("resume", () => scheduleCheck());
    return () => {
      sub.remove();
    };
  }, [scheduleCheck]);

  // Revalidar al volver a ser visible (web/PWA)
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") scheduleCheck();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [scheduleCheck]);

  // Revalidar si otra parte de la app actualiza el mapa offline (evento 'storage')
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === MAP_KEY) scheduleCheck();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [scheduleCheck]);

  // Poll suave por si la fecha cambia “en caliente”
  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    // Intervalo corto para máxima precisión sin ser agresivo
    pollRef.current = setInterval(scheduleCheck, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [scheduleCheck]);

  return null;
}
