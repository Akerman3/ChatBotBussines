// src/components/Subscription.tsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { getAuth } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import "../styles/Subscription.css";

import { saveOfflineSubFor } from "../lib/offlineSubStorage";

import "cordova-plugin-purchase";
const IAP: any = (window as any).CdvPurchase || {};
const { store, ProductType, Platform } = IAP;

// ✅ SEGURIDAD: Valores cargados desde variables de entorno
const PACKAGE_NAME = import.meta.env.VITE_PACKAGE_NAME || "com.alcalculadora.app";
const VERIFY_URL = import.meta.env.VITE_VERIFY_URL || "";
// ===============================================

// ✅ Logger condicional para evitar exponer datos sensibles en producción
const isDev = import.meta.env.DEV;
const debugLog = isDev ? console.log.bind(console, "[IAP]") : () => { };

// ⚠️ NUEVO producto y base plans (como en el otro componente)
const PRODUCT_ID = "premium.pro";
const BASEPLAN_MONTH = "subs-mensual-v2";
const BASEPLAN_YEAR = "subs-anual-v2";

function safe(o: any) { try { return JSON.parse(JSON.stringify(o)); } catch { return o; } }

/* ---------------------------------
 * Utilidades de extracción de token
 * --------------------------------- */
function deepFindPurchaseToken(obj: any, depth = 0): string | null {
  if (!obj || typeof obj !== "object" || depth > 6) return null;
  for (const [k, v] of Object.entries(obj)) {
    const key = k.toLowerCase();
    if ((key.includes("purchasetoken") || key === "token") && typeof v === "string" && v.length > 5) return v;
    if (typeof v === "string") {
      const s = v.trim();
      if (s.startsWith("{") || s.startsWith("[")) {
        try {
          const j = JSON.parse(s);
          const t = deepFindPurchaseToken(j, depth + 1);
          if (t) return t;
        } catch { }
      }
    }
    if (typeof v === "object") {
      const t = deepFindPurchaseToken(v, depth + 1);
      if (t) return t;
    }
  }
  return null;
}
function tryTokenValue(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") {
    const s = v.trim();
    if (s.startsWith("{") || s.startsWith("[")) {
      try { const j = JSON.parse(s); const t = deepFindPurchaseToken(j); if (t) return t; } catch { }
    }
    return s.length > 5 ? s : null;
  }
  if (typeof v === "object") {
    const t = deepFindPurchaseToken(v);
    if (t) return t;
  }
  return null;
}
function extractPurchaseToken(rcpt: any): string | null {
  const candidates: any[] = [
    rcpt?.transaction?.purchaseToken, rcpt?.transaction?.id, rcpt?.purchaseToken,
    rcpt?.receipt?.purchaseToken, rcpt?.receipt, rcpt?.payload?.purchaseToken,
    rcpt?.payload, rcpt?.originalJson, rcpt?.transaction?.receipt, rcpt?.extra, rcpt,
  ];
  for (const c of candidates) { const t = tryTokenValue(c); if (t) return t; }
  return null;
}

/* ---------------------------------
 * Listeners con timeout (race)
 * --------------------------------- */
function waitForUserActive(uid: string, ms = 30000): Promise<boolean> {
  const db = getFirestore();
  const ref = doc(db, "users", uid);
  return new Promise((resolve) => {
    const stop = onSnapshot(ref, (snap) => {
      const st = (snap.data() as any)?.subscriptionStatus;
      if (st === "active") { stop(); resolve(true); }
    });
    setTimeout(() => { try { stop(); } catch { } resolve(false); }, ms);
  });
}

/** Determina el label a guardar según el estado. */
function computeLabelFromState(state?: string): string {
  const s = (state || "").toUpperCase();
  const canceledLike = /(CANCEL|EXPIRE|ON_HOLD|PAUSE)/.test(s);
  return canceledLike ? "Fecha de fin de suscripción:" : "Fecha de renovación automática:";
}

/**
 * Observa playSubscriptions/{purchaseToken} hasta que esté activa.
 * Además, si se provee `opt.email`, persistirá el caché offline con la
 * expiryTimeMillis y el estado que lleguen desde Firestore.
 */
function waitForPlaySubActive(
  purchaseToken: string,
  ms = 30000,
  opt?: { email?: string }
): Promise<boolean> {
  const db = getFirestore();
  const ref = doc(db, "playSubscriptions", purchaseToken);
  return new Promise((resolve) => {
    const stop = onSnapshot(ref, (snap) => {
      const d = snap.data() as any;
      const expiry = Number(d?.expiryTimeMillis ?? 0);
      const isActive = Boolean(d?.isActive) || (Number.isFinite(expiry) && expiry > Date.now());

      // Persistimos offline si tenemos email y una fecha válida
      if (opt?.email && Number.isFinite(expiry) && expiry > 0) {
        const state = String(d?.subscriptionState || (isActive ? "SUBSCRIBED" : ""));
        const label = computeLabelFromState(state);
        // ✅ Usar void para manejar promesa sin await (el callback no puede ser async)
        void saveOfflineSubFor(opt.email, { expiryTimeMillis: expiry, subscriptionState: state, label }).catch(() => { });
      }

      if (isActive) { stop(); resolve(true); }
    });
    setTimeout(() => { try { stop(); } catch { } resolve(false); }, ms);
  });
}

/* ---------------------------------
 * Componente
 * --------------------------------- */
export default function Subscription() {
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [productObj, setProductObj] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState("");
  const [affiliateName, setAffiliateName] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [serverErrorMsg, setServerErrorMsg] = useState("");
  const [purchaseStatus, setPurchaseStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const didNavigateRef = useRef(false);

  const nav = useNavigate();
  const auth = getAuth();
  const functions = getFunctions();

  const navigateOnce = (path: string) => {
    if (didNavigateRef.current) return;
    didNavigateRef.current = true;
    setTimeout(() => nav(path, { replace: true }), 150);
  };

  // Mostrar animación de carga
  const showPurchaseLoading = () => {
    setPurchaseStatus('loading');
  };

  // Mostrar resultado de compra
  const showPurchaseResult = (success: boolean) => {
    setPurchaseStatus(success ? 'success' : 'error');

    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      setPurchaseStatus(null);
    }, 3000);
  };

  // Función legacy para compatibilidad
  const showPurchaseFailed = () => {
    showPurchaseResult(false);
  };

  // Listener permanente a users/{uid} -> navega cuando sea active
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    const db = getFirestore();
    const ref = doc(db, "users", u.uid);
    const stop = onSnapshot(ref, (snap) => {
      const st = (snap.data() as any)?.subscriptionStatus;
      if (st === "active") navigateOnce("/main");
    });
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mapea y verifica en backend
  const linkAndVerify = async (token: string, uid: string): Promise<boolean> => {
    try {
      const link = httpsCallable(functions, "linkPurchaseToken");
      await link({ purchaseToken: token, packageName: PACKAGE_NAME, email: auth.currentUser?.email ?? null });
    } catch { }

    try {
      // ✅ SEGURIDAD: Obtener ID token para autenticar la petición
      const idToken = await auth.currentUser?.getIdToken(false);

      const res = await fetch(VERIFY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ✅ Enviar token de autenticación para que el servidor valide
          ...(idToken ? { "Authorization": `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ uid, packageName: PACKAGE_NAME, purchaseToken: token }),
      });
      const json = await res.json().catch(() => ({} as any));
      debugLog("verifyAndSave =>", safe(json));
      const expiry = Number(json?.expiryTimeMillis ?? 0);

      // Persistimos caché offline si obtenemos fecha y tenemos email
      const email = auth.currentUser?.email || null;
      if (email && Number.isFinite(expiry) && expiry > 0) {
        const state = String(json?.subscriptionState || (expiry > Date.now() ? "SUBSCRIBED" : ""));
        const label = computeLabelFromState(state);
        try { await saveOfflineSubFor(email, { expiryTimeMillis: expiry, subscriptionState: state, label }); } catch { }
      }

      if (res.ok && json?.ok !== false && Number.isFinite(expiry) && expiry > Date.now()) {
        navigateOnce("/main");
        return true;
      }
    } catch { }

    // Fallback: esperamos a que se marque active por users o playSubscriptions
    const email = auth.currentUser?.email || undefined;
    const [uOk, pOk] = await Promise.all([
      waitForUserActive(uid, 30000),
      waitForPlaySubActive(token, 30000, { email })
    ]);
    if (uOk || pOk) { navigateOnce("/main"); return true; }
    return false;
  };

  // Inicialización de la tienda y listeners
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) { console.warn("[IAP] no-nativo"); return; }
    if (!store) { console.error("[IAP] store no disponible"); return; }
    try { store.verbosity = store.DEBUG; } catch { }

    // Errores globales -> mensaje único
    const offErr = store.error((_e: any) => { showPurchaseFailed(); });

    const offApproved = store.when().approved(async (tx: any) => {
      try { await tx.verify(); } catch (e) { console.error("[IAP] verify err", e); }
    });

    const offVerified = store.when().verified(async (rcpt: any) => {
      try {
        const u = auth.currentUser;
        if (!u) { alert("Debes iniciar sesión para completar la compra."); try { await rcpt.finish(); } catch { } return; }
        const token = extractPurchaseToken(rcpt);
        if (!token) { console.error("[IAP] token no encontrado. Recibo:", safe(rcpt)); showPurchaseFailed(); try { await rcpt.finish(); } catch { } return; }
        const navigated = await linkAndVerify(token, u.uid);
        try { await rcpt.finish(); } catch { }

        // Mostrar éxito antes de navegar
        showPurchaseResult(true);

        if (!didNavigateRef.current && !navigated) {
          setTimeout(() => navigateOnce("/main"), 3200); // Esperar animación
        } else if (navigated) {
          setTimeout(() => navigateOnce("/main"), 1000); // Navegar más rápido si ya está OK
        }
      } catch (e) {
        console.error("[IAP] verified error", e);
        showPurchaseFailed();
        try { await rcpt.finish(); } catch { }
      }
    });

    // Inicialización de la tienda
    (async () => {
      store.register([{ id: PRODUCT_ID, type: ProductType.PAID_SUBSCRIPTION, platform: Platform.GOOGLE_PLAY }]);
      await store.initialize([Platform.GOOGLE_PLAY]);
      await store.update();
      const p = store.get(PRODUCT_ID, Platform.GOOGLE_PLAY);
      setProductObj(p || null);
      debugLog("product:", safe(p));
      debugLog("product.offers:", safe(p?.offers));
      setReady(true);
    })().catch((e) => console.error("[IAP] init err", e));

    return () => { offErr?.remove?.(); offApproved?.remove?.(); offVerified?.remove?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Selección estricta de oferta/base plan (misma lógica)
  const pickOffer = (basePlanId: string, wantedPeriod: "P1M" | "P1Y") => {
    const offers: any[] = productObj?.offers || [];
    if (!offers.length) return null;

    let off: any =
      offers.find((o) => o?.googleplay?.base_plan_id === basePlanId) ||
      offers.find((o) => o?.googlePlay?.basePlanId === basePlanId) ||
      offers.find((o) => o?.basePlanId === basePlanId);
    if (off) return off;

    const hasPeriod = (o: any, period: string) => {
      const phases = o?.pricingPhases || o?.pricing?.phases || [];
      return phases?.some(
        (ph: any) => ph?.billingPeriod === period || ph?.billing_period === period || ph?.period === period
      );
    };
    off = offers.find((o) => hasPeriod(o, wantedPeriod));
    if (off) return off;
    return null;
  };

  const ensureProduct = async () => {
    if (productObj) return true;
    try { await store.update(); const p = store.get(PRODUCT_ID, Platform.GOOGLE_PLAY); setProductObj(p || null); return !!p; }
    catch { return false; }
  };

  // REFRESH normal (catálogo fresco)
  const refreshAndPick = async (basePlanId: string, wantedPeriod: "P1M" | "P1Y") => {
    await store.update();
    const p = store.get(PRODUCT_ID, Platform.GOOGLE_PLAY);
    setProductObj(p || null);
    const offers: any[] = p?.offers || [];
    if (!offers.length) return null;
    let off: any =
      offers.find((o) => o?.googleplay?.base_plan_id === basePlanId) ||
      offers.find((o) => o?.googlePlay?.basePlanId === basePlanId) ||
      offers.find((o) => o?.basePlanId === basePlanId);
    if (off) return off;
    const hasPeriod = (o: any, period: string) => {
      const phases = o?.pricingPhases || o?.pricing?.phases || [];
      return phases?.some((ph: any) => ph?.billingPeriod === period || ph?.billing_period === period || ph?.period === period);
    };
    off = offers.find((o) => hasPeriod(o, wantedPeriod));
    return off || null;
  };

  // HARD refresh (re-register + initialize) para caches tercas
  const hardRefreshAndPick = async (basePlanId: string, wantedPeriod: "P1M" | "P1Y") => {
    try {
      store.register([{ id: PRODUCT_ID, type: ProductType.PAID_SUBSCRIPTION, platform: Platform.GOOGLE_PLAY }]);
      await store.initialize([Platform.GOOGLE_PLAY]);
    } catch { }
    return refreshAndPick(basePlanId, wantedPeriod);
  };

  const orderStrict = async (basePlanId: string) => {
    const u = auth.currentUser;
    if (!u) { alert("Inicia sesión para continuar."); return; }

    const ok = await ensureProduct();
    if (!ok) { showPurchaseFailed(); return; }

    const wantedPeriod = basePlanId === BASEPLAN_YEAR ? "P1Y" : "P1M";

    // Primer intento SIEMPRE con catálogo fresco
    let offer = await refreshAndPick(basePlanId, wantedPeriod);
    debugLog("selected offer (fresh) for", basePlanId, "->", safe(offer));
    if (!offer) { alert(`No se encontró la oferta "${basePlanId}" (${wantedPeriod}). Revisa que el base plan esté ACTIVO en "${PRODUCT_ID}".`); return; }

    try {
      if (store && "applicationUsername" in store && u?.uid) (store as any).applicationUsername = u.uid;
    } catch { }

    try {
      const res = await store.order(offer);
      debugLog("order(offer) ->", safe(res));
      if ((res as any)?.isError) throw res;

      const earlyToken =
        tryTokenValue((res as any)?.transaction?.purchaseToken) ||
        tryTokenValue((res as any)?.purchaseToken) ||
        tryTokenValue((res as any)?.receipt) ||
        tryTokenValue((res as any)?.originalJson);
      if (earlyToken) void linkAndVerify(earlyToken, u.uid);
    } catch (e: any) {
      const msg = String(e?.message || "").toLowerCase();
      const isExpired = msg.includes("expired product details") || msg.includes("product details not found");

      if (isExpired) {
        // Reintento con HARD refresh (igual que el otro componente)
        try {
          debugLog("retry with HARD refresh …");
          offer = await hardRefreshAndPick(basePlanId, wantedPeriod);
          debugLog("selected offer (retry) ->", safe(offer));
          if (!offer) { showPurchaseFailed(); return; }
          const res2 = await store.order(offer);
          debugLog("order(offer) retry ->", safe(res2));
          if ((res2 as any)?.isError) throw res2;

          const earlyToken2 =
            tryTokenValue((res2 as any)?.transaction?.purchaseToken) ||
            tryTokenValue((res2 as any)?.purchaseToken) ||
            tryTokenValue((res2 as any)?.receipt) ||
            tryTokenValue((res2 as any)?.originalJson);
          if (earlyToken2) void linkAndVerify(earlyToken2, u.uid);
          return;
        } catch (e2) {
          console.error("[IAP] order retry error:", safe(e2));
          showPurchaseFailed();
          return;
        }
      }

      console.error("[IAP] order error:", safe(e));
      showPurchaseFailed();
    }
  };

  const buyMonthly = async () => {
    setLoadingBtn(BASEPLAN_MONTH);
    showPurchaseLoading();
    try {
      await orderStrict(BASEPLAN_MONTH);
      // El éxito se maneja en el handler verified/approved
    } catch (e) {
      showPurchaseResult(false);
    } finally {
      setLoadingBtn(null);
    }
  };

  const buyYearly = async () => {
    setLoadingBtn(BASEPLAN_YEAR);
    showPurchaseLoading();
    try {
      await orderStrict(BASEPLAN_YEAR);
      // El éxito se maneja en el handler verified/approved
    } catch (e) {
      showPurchaseResult(false);
    } finally {
      setLoadingBtn(null);
    }
  };

  // Handler para el botón de código de afiliado
  const handleAffiliateCode = () => {
    setIsModalOpen(true);
    setIsFlipped(false);
    setCodeError(false);
    setAffiliateCode("");
    setAffiliateName("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsFlipped(false);
    setCodeError(false);
    setAffiliateCode("");
    setAffiliateName("");
  };

  const handleCodeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsValidatingCode(true);

    const formData = new FormData(e.currentTarget);
    const code = formData.get("code") as string;

    try {
      // Llamar a la Cloud Function para validar el código
      const validateCode = httpsCallable(functions, "validateAffiliateCode");
      const result = await validateCode({ code });
      const data = result.data as any;

      if (data.success) {
        // Código válido
        setAffiliateName(data.affiliateName || "Afiliado");
        setCodeError(false);
        setServerErrorMsg("");
        setIsFlipped(true);
      } else {
        // Código inválido o ya usado
        setCodeError(true);
        // Personalizar el mensaje si ya tiene un código
        if (data.message === "Ya tienes un código asociado") {
          setServerErrorMsg("Este código ya ha sido canjeado");
        } else {
          setServerErrorMsg(data.message || "El código que ingresaste no existe o ya no está disponible.");
        }
        setIsFlipped(true);
      }
    } catch (error) {
      console.error("Error validando código:", error);
      setCodeError(true);
      setIsFlipped(true);
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleTryAgain = () => {
    setIsFlipped(false);
    setCodeError(false);
    setServerErrorMsg("");
    setAffiliateCode("");
  };

  return (
    <div className="subscription-container">
      <div className="al-icon"><img src="/assets/home.png" alt="AL" /></div>

      <div className="subscription-header">
        <h1 className="subscription-title-main">AL</h1>
        <div className="subscription-title-underline"></div>
        <h2 className="subscription-subtitle">CALCULADORA</h2>
      </div>

      <div className="subscription-card">
        <div className="card__border" />
        <h2>Actualizar cuenta</h2>

        <div className="subscription-box">
          <ul className="subscription-features">
            {/* EXISTENTES */}
            <li>
              <span className="check">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="check_svg">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="list_text">Editor de formulas.</span>
            </li>
            <li>
              <span className="check">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="check_svg">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="list_text">Cotizador de proyectos.</span>
            </li>
            <li>
              <span className="check">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="check_svg">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="list_text">Blok de notas inteligente.</span>
            </li>

            {/* NUEVAS (en este orden) */}
            <li>
              <span className="check">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="check_svg">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="list_text">Optimizador de material.</span>
            </li>
            <li>
              <span className="check">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="check_svg">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="list_text">Funciones pro.</span>
            </li>
            <li>
              <span className="check">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="check_svg">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="list_text">Curso gratis.</span>
            </li>
            <li>
              <span className="check">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="check_svg">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="list_text">Accesos sin internet.</span>
            </li>
            <li>
              <span className="check">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="check_svg">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="list_text">Almacenamiento en la nube.</span>
            </li>
          </ul>

          {/* Los precios quedan desplazados hacia abajo automáticamente */}
          <div className="sub-option">
            <p><strong>$279 MXN</strong> <span className="sub-text">/mes</span></p>
            <button className="subscribe-button btn-hover-effect" onClick={buyMonthly} disabled={!!loadingBtn || !ready}>
              {loadingBtn === BASEPLAN_MONTH ? "Procesando..." : "Actualizar ahora."}
            </button>
          </div>

          <div className="sub-option">
            <p>
              <strong>{"$2,499 MXN"}</strong> <span className="sub-text">/año</span>
              <span className="discount-badge">-25%</span>
            </p>
            <button className="subscribe-button btn-hover-effect" onClick={buyYearly} disabled={!!loadingBtn || !ready}>
              {loadingBtn === BASEPLAN_YEAR ? "Procesando..." : "Actualizar ahora."}
            </button>
          </div>

          {/* NUEVO BOTÓN VERDE - Tengo un código */}
          <div className="sub-option sub-option-affiliate">
            <button
              className="subscribe-button btn-hover-effect btn-affiliate-code"
              onClick={handleAffiliateCode}
            >
              Tengo un código
            </button>
          </div>
        </div>
      </div>

      {/* Modal de código de afiliado */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>
              ×
            </button>

            <div className="flip-card">
              <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
                {/* FRONT - Formulario de código */}
                <div className="flip-card-front">
                  <form className="affiliate-form" onSubmit={handleCodeSubmit}>
                    <p className="form-title">Centro de códigos</p>
                    <p className="form-message">Introduce tu código de referencia</p>

                    <label className="form-label">
                      <input
                        className="form-input"
                        type="text"
                        name="code"
                        placeholder=" "
                        value={affiliateCode}
                        onChange={(e) => setAffiliateCode(e.target.value)}
                        required
                        disabled={isValidatingCode}
                      />
                      <span>Código</span>
                    </label>

                    <button
                      type="submit"
                      className="form-submit"
                      disabled={isValidatingCode}
                    >
                      {isValidatingCode ? "Validando..." : "Enviar"}
                    </button>
                  </form>
                </div>

                {/* BACK - Confirmación (éxito o error) */}
                <div className="flip-card-back">
                  {codeError ? (
                    // Código inválido
                    <div className="confirmation-card">
                      <h2 className="confirmation-error">
                        {serverErrorMsg === "Este código ya ha sido canjeado" ? "CÓDIGO YA USADO" : "CÓDIGO NO VÁLIDO"}
                      </h2>
                      <p className="confirmation-message">
                        {serverErrorMsg}
                      </p>

                      <button
                        className="form-submit"
                        onClick={handleTryAgain}
                      >
                        Inténtalo de nuevo
                      </button>
                    </div>
                  ) : (
                    // Código válido
                    <div className="confirmation-card">
                      <p className="confirmation-label">código de</p>
                      <h2 className="confirmation-name">{affiliateName}</h2>
                      <p className="confirmation-message">Has canjeado el código exitosamente.</p>

                      <div className="confirmation-plan">
                        <p><strong>$279 MXN</strong> <span className="plan-text">/mes</span></p>
                        <button
                          className="subscribe-button btn-hover-effect"
                          onClick={() => {
                            handleCloseModal();
                            buyMonthly();
                          }}
                        >
                          Actualizar ahora.
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de estado de compra */}
      {purchaseStatus && (
        <div className="purchase-status-overlay">
          <div className="purchase-status-container">
            {purchaseStatus === 'loading' && (
              <div className="loading-circle">
                <div className="square" />
              </div>
            )}

            {purchaseStatus === 'success' && (
              <div className="result-message success">
                <p className="result-message-text">¡Compra Exitosa!!</p>
              </div>
            )}

            {purchaseStatus === 'error' && (
              <div className="result-message error">
                <p className="result-message-text">Compra Fallida</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}