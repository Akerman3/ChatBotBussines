// src/components/MainMenu.tsx
import React, { useState, useEffect } from "react";
import { Settings, DoorOpen as Door, ClipboardList, NotebookPen, Bell } from "lucide-react";
import { App as CapacitorApp, App as CapacitorAppClass } from "@capacitor/app";
import { initPush } from "../lib/initPush";
import { getAuth, onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  getFirestore,
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { WindowIcon } from "./WindowIcon";
import { WindowSubmenu } from "./WindowTypes";
import { QuoteSubmenu } from "./QuoteSubmenu";
import { DoubleSlidingQuoteCalculator } from "./DoubleSlidingQuoteCalculator";
import { DoubleSlidingQuoteCalculatorLine2 } from "./DoubleSlidingQuoteCalculatorLine2";
import { TwoFixedTwoSlidingQuoteCalculator } from "./TwoFixedTwoSlidingQuoteCalculator";
import { FourSlidingQuoteCalculator } from "./FourSlidingQuoteCalculator";
import { XXCalculator } from "./XXCalculator";
import { TwoFixedTwoSlidingCalculator } from "./TwoFixedTwoSlidingCalculator";
import { FourSlidingCalculator } from "./FourSlidingCalculator";
import { DoorSubmenu } from "./DoorSubmenu";
import { Notes } from "./Notes";
import { FixedSlidingCalculator } from "./FixedSlidingCalculator";
import { FixedSlidingQuoteCalculatorLine2 } from "./FixedSlidingQuoteCalculatorLine2";
import WindowCalculator from "./WindowCalculator";
import { WindowCalculatorLine2 } from "./WindowCalculatorLine2";
import { DoorCalculator } from "./DoorCalculator";
import { WindowQuoteCalculator } from "./WindowQuoteCalculator";
import { PriceDatabase } from "./PriceDatabase";
import { GeneralQuoteCalculator } from "./GeneralQuoteCalculator";
import QuoteSheetHome from "./QuoteSheetHome";

import "../styles/MainMenu.css";

/* ====== Bold backup y helpers ====== */
import BoldBackupMenu from "./BoldBackupMenu";
import { getBackupJsonString, restoreFromJsonString } from "../utils/backupManager";
import { uploadBackup, downloadLatestBackup } from "../lib/cloudBackup";

/* ====== Logger (solo backup/ui) ====== */
import { createLogger } from "../lib/logger";

/* ====== Auto-backup silencioso cada 24h ====== */
import { useAutoBackup } from "../hooks/useAutoBackup";

/* ====== Persistencia offline para la fecha del engrane ====== */
type OfflineSubRecord = {
  expiryTimeMillis: number;
  subscriptionState?: string;
  savedAt: number;
};
const offlineKey = (uid?: string, email?: string) =>
  `alcalc.offlineSub.v1.${uid ?? email ?? "anon"}`;

function saveOfflineSub(
  uid: string | undefined,
  email: string | undefined,
  data: { expiryTimeMillis?: any; subscriptionState?: any }
) {
  const key = offlineKey(uid, email);
  const prev: OfflineSubRecord =
    JSON.parse(localStorage.getItem(key) || "null") || {
      expiryTimeMillis: 0,
      savedAt: 0,
    };
  const next: OfflineSubRecord = {
    ...prev,
    expiryTimeMillis: Number(data.expiryTimeMillis ?? prev.expiryTimeMillis ?? 0),
    subscriptionState:
      typeof data.subscriptionState === "string"
        ? data.subscriptionState
        : prev.subscriptionState,
    savedAt: Date.now(),
  };
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
}

function loadOfflineSub(uid?: string, email?: string): OfflineSubRecord | null {
  try {
    const raw = localStorage.getItem(offlineKey(uid, email));
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!Number.isFinite(obj?.expiryTimeMillis)) return null;
    return obj as OfflineSubRecord;
  } catch {
    return null;
  }
}

// === Config Play ===
const PACKAGE_NAME = "com.alcalculadora.app";

// Íconos (carpeta public/assets/icons)
const ICONS = {
  alert: "/assets/icons/alert-icono.png",
  tarjeta: "/assets/icons/tarjeta-icono.png",
  salida: "/assets/icons/salida-icono.png",
  curso: "/assets/icons/curso-icon.png",
  whats: "/assets/icons/whats-icon.png",
  // nuevo ícono del grupo
  grupo: "/assets/icons/grupo-icono.png",
};

// URLs de acciones
const COURSE_URL =
  "https://www.youtube.com/playlist?app=desktop&list=PL2CS-Ysr2M95vCJINdRh-J0LOyTwyeV_1&jct=AQ_UAzMDBTFE-OxZUb8ekA";
const WHATS_URL = "https://wa.me/522721917499";
const PRIVACY_URL =
  "https://sites.google.com/view/al-calculadora/p%C3%A1gina-principal";
const REPORTS_MAILTO =
  "mailto:aloficialsoport@gmail.com?subject=Reporte%20AL%20Calculadora&body=Describe%20tu%20reporte%20aqu%C3%AD.%0A%0A-%20Versi%C3%B3n%20de%20app:%0A-%20Modelo:%0A-%20Android:%0A";
// “Contáctanos” por WhatsApp:
const CONTACT_WHATS = "https://wa.me/522721917499";
// 🔗 Grupo exclusivo (nuevo)
const GROUP_URL = "https://chat.whatsapp.com/CrO7MXvGWnJ1Dj16kMrY6V?mode=wwt";

/* Helper: abrir con la app nativa cuando sea posible */
async function openExternal(url: string) {
  try {
    await CapacitorAppClass.openUrl({ url });
  } catch {
    try {
      (window as any).open(url, "_system");
    } catch {
      window.open(url, "_blank");
    }
  }
}

type Screen =
  | "main"
  | "windows"
  | "doors"
  | "quote"
  | "notes"
  // Window calculators L3
  | "fixedSlidingL3"
  | "doubleSlidingL3"
  | "twoFixedTwoSlidingL3"
  | "fourSlidingL3"
  // Window calculators L2
  | "fixedSlidingL2"
  | "doubleSlidingL2"
  // Door calculators
  | "doorL3"
  // Quote “hub”
  | "windowQuote"
  | "priceDatabase"
  | "generalQuote"
  | "quoteSheetHome"
  // Quote calculators L3
  | "fixedSlidingQuoteL3"
  | "doubleSlidingQuoteL3"
  | "twoFixedTwoSlidingQuoteL3"
  | "fourSlidingQuoteL3"
  // Quote calculators L2
  | "fixedSlidingQuoteL2"
  | "doubleSlidingQuoteL2";

interface NavigationData {
  initialWidth?: string;
  initialHeight?: string;
  fromNotes?: boolean;
}

function MenuButton({
  icon: Icon,
  title,
  subtitle,
  isCustomIcon = false,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  isCustomIcon?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex items-center mb-8 group transition-transform hover:scale-105"
      onClick={onClick}
      aria-label={`Ir a ${title.toLowerCase()}`}
    >
      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mr-6">
        {isCustomIcon ? <Icon size={48} className="text-[#003366]" /> : <Icon size={40} className="text-[#003366]" />}
      </div>
      <div className="text-left">
        <h2 className="text-white text-3xl font-bold">{title}</h2>
        <p className="text-gray-300 text-lg">{subtitle}</p>
      </div>
    </button>
  );
}

// 🔹 Liberar la “llave” al cerrar sesión
import { releaseDeviceLock } from "../lib/deviceLock";
// 🔔 Bandeja de mensajes
import MessageTray from "./MessageTray";

type TrayMessage = {
  id: string;
  title?: string;
  body: string;
  createdAt: Date;
  isNew: boolean;
};

/* ====== Componente invisible para activar auto-backup ====== */
const AutoBackupMount: React.FC = () => {
  useAutoBackup();
  return null;
};

/* ====== Pressable con sombra sutil y sin hundimiento si se requiere ====== */
const Pressable: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    rounded?: number;
    noShadow?: boolean;
    noTranslate?: boolean;
  }
> = ({ rounded = 12, noShadow = false, noTranslate = false, style, children, ...rest }) => {
  const [down, setDown] = useState(false);
  return (
    <button
      {...rest}
      onPointerDown={(e) => { setDown(true); rest.onPointerDown?.(e); }}
      onPointerUp={(e) => { setDown(false); rest.onPointerUp?.(e); }}
      onPointerLeave={(e) => { setDown(false); rest.onPointerLeave?.(e); }}
      style={{
        borderRadius: rounded,
        transition: "transform .08s ease, box-shadow .12s ease",
        transform: down && !noTranslate ? "translateY(1px) scale(.99)" : "none",
        boxShadow: noShadow
          ? "none"
          : (down ? "0 3px 10px rgba(0,0,0,.28)" : "0 8px 18px rgba(0,0,0,.22)"),
        background: "transparent",
        border: 0,
        width: "100%",
        ...style,
      }}
    >
      {children}
    </button>
  );
};

const MainMenu: React.FC = () => {
  const blog = createLogger("backup:ui");

  const [screenHistory, setScreenHistory] = useState<Screen[]>(["main"]);
  const [navigationData, setNavigationData] = useState<NavigationData>({});
  const currentScreen = screenHistory[screenHistory.length - 1];

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const [trayMessages, setTrayMessages] = useState<TrayMessage[]>([]);

  const [user, setUser] = useState<User | null>(getAuth().currentUser);
  const [userDoc, setUserDoc] = useState<any>(null);

  const nav = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ====== Handlers de Bold (generar/restaurar) ====== */
  const handleGenerateBackup = async () => {
    blog.info("Click: Generar copia");
    try {
      try { blog.time("generate"); } catch {}
      const res = getBackupJsonString();
      blog.debug("getBackupJsonString() =>", { success: res?.success, msg: res?.message });

      if (!res?.success || !res?.jsonString) {
        blog.warn("No se pudo generar JSON de backup");
        alert(res?.message || "No se pudo generar la copia.");
        try { blog.timeEnd("generate"); } catch {}
        return;
      }

      const bytes = new Blob([res.jsonString]).size;
      blog.info(`Backup JSON generado: ~${(bytes / 1024).toFixed(1)} KB`);

      blog.info("Llamando uploadBackup()…");
      await uploadBackup(res.jsonString);
      blog.info("uploadBackup() OK");

      alert("Copia generada y subida correctamente.");
      try { blog.timeEnd("generate"); } catch {}
    } catch (e) {
      blog.error("Error en handleGenerateBackup:", e);
      alert("Error al generar/subir la copia de seguridad.");
      try { blog.timeEnd("generate"); } catch {}
    }
  };

  const handleRestoreBackup = async () => {
    blog.info("Click: Restablecer copia");
    const ok = confirm("¿Restaurar la copia más reciente? Esto sobrescribirá datos locales.");
    if (!ok) { blog.info("Usuario canceló restauración"); return; }

    try {
      try { blog.time("restore"); } catch {}
      blog.info("Llamando downloadLatestBackup()…");
      const json = await downloadLatestBackup();
      blog.debug("downloadLatestBackup() OK, longitud:", json?.length ?? 0);

      const res = restoreFromJsonString(json);
      blog.debug("restoreFromJsonString() =>", { success: res?.success, msg: res?.message });
      alert(res?.message || "Restauración finalizada.");

      if (res?.success) {
        blog.info("Recargando app para aplicar cambios…");
        window.location.reload();
      }
      try { blog.timeEnd("restore"); } catch {}
    } catch (e: any) {
      blog.error("Error en handleRestoreBackup:", e);
      const detail = (e?.code ? `${e.code} — ` : "") + (e?.message ?? String(e));
      alert("Error al restaurar la copia de seguridad.\n\nDetalle: " + detail);
      try { blog.timeEnd("restore"); } catch {}
    }
  };
  // =========================================================

  // Auth
  useEffect(() => {
    const auth = getAuth();
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubAuth();
  }, []);

  // initPush.ts
  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const token = await initPush();
        if (!token) return;
        const db = getFirestore();
        await setDoc(
          doc(db, "users", user.uid, "deviceTokens", token),
          { token, platform: "android", lastSeenAt: serverTimestamp(), enabled: true },
          { merge: true }
        );
      } catch {}
    })();
  }, [user]);

  // users/{uid}
  useEffect(() => {
    if (!user) { setUserDoc(null); return; }
    const db = getFirestore();
    const ref = doc(db, "users", user.uid);
    const stop = onSnapshot(ref, (snap) => {
      const data = snap.data();
      setUserDoc(data);

      try {
        const ms = Number(data?.expiryTimeMillis ?? 0);
        const st = String(data?.lastPlayState?.subscriptionState ?? "");
        if (Number.isFinite(ms) && ms > 0) {
          saveOfflineSub(user.uid, user.email ?? undefined, {
            expiryTimeMillis: ms,
            subscriptionState: st,
          });
        }
      } catch {}
    });
    return () => stop();
  }, [user]);

  // 🔔 announcements
  useEffect(() => {
    if (!user) { setUnreadCount(0); setTrayMessages([]); return; }
    const db = getFirestore();

    const lastSeenMs: number =
      (userDoc?.lastSeenAnnouncementsAt?.toMillis && userDoc.lastSeenAnnouncementsAt.toMillis()) || 0;

    const q = query(
      collection(db, "announcements"),
      where("isDeleted", "==", false),
      orderBy("createdAt", "desc"),
      limit(25)
    );

    const stop = onSnapshot(q, (snap) => {
      let count = 0;
      const list: TrayMessage[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        const ts = data?.createdAt;
        const ms = ts?.toMillis ? ts.toMillis() : 0;
        const created = ms > 0 ? new Date(ms) : new Date();
        const isNew = ms > lastSeenMs;
        if (isNew) count++;

        list.push({
          id: d.id,
          title: data?.title || "AL Calculadora",
          body: String(data?.body ?? ""),
          createdAt: created,
          isNew,
        });
      });
      setUnreadCount(count);
      setTrayMessages(list);
    });

    return () => stop();
  }, [user, userDoc]);

  // Back + evento custom
  useEffect(() => {
    const handleNavigateToScreen = (event: Event) => {
      const custom = event as CustomEvent;
      const { screen } = custom.detail || {};
      if (screen) navigateToScreen(screen as Screen);
    };
    window.addEventListener("navigateToScreen", handleNavigateToScreen as EventListener);

    const handleBackButton = () => {
      if (currentScreen === "main" && drawerOpen) {
        setDrawerOpen(false);
        return { shouldOverrideUrlLoading: true };
      }
      if (screenHistory.length > 1) {
        setScreenHistory((prev) => prev.slice(0, -1));
        return { shouldOverrideUrlLoading: true };
      }
      return { shouldOverrideUrlLoading: false };
    };

    CapacitorApp.addListener("backButton", handleBackButton);
    return () => {
      window.removeEventListener("navigateToScreen", handleNavigateToScreen as EventListener);
      CapacitorApp.removeAllListeners();
    };
  }, [screenHistory, currentScreen, drawerOpen]);

  const navigateToScreen = (screen: Screen, data?: NavigationData) => {
    setScreenHistory((prev) => [...prev, screen]);
    setNavigationData(data ?? {});
  };

  const goBack = () => {
    if (screenHistory.length > 1) {
      setScreenHistory((prev) => prev.slice(0, -1));
      setNavigationData({});
    }
  };

  // Navegación hacia calculadoras (…sin cambios)
  const handleNavigateToCalculator = (
    option: "quote" | "work",
    line: "L3" | "L2",
    componentType: "door" | "window",
    windowType: string = "",
    width: string = "",
    height: string = "",
    fromNotes: boolean = false
  ) => {
    const data: NavigationData = { initialWidth: width, initialHeight: height, fromNotes };
    if (componentType === "window") {
      if (option === "work") {
        if (line === "L3") {
          if (windowType === "fixed-sliding-window") navigateToScreen("fixedSlidingL3", data);
          else if (windowType === "double-sliding-window") navigateToScreen("doubleSlidingL3", data);
          else if (windowType === "two-fixed-two-sliding-window") navigateToScreen("twoFixedTwoSlidingL3", data);
          else if (windowType === "four-sliding-window") navigateToScreen("fourSlidingL3", data);
        } else {
          if (windowType === "fixed-sliding-window") navigateToScreen("fixedSlidingL2", data);
          else if (windowType === "double-sliding-window") navigateToScreen("doubleSlidingL2", data);
        }
      } else {
        if (line === "L3") {
          if (windowType === "fixed-sliding-window") navigateToScreen("fixedSlidingQuoteL3", data);
          else if (windowType === "double-sliding-window" || windowType === "Doble Corrediza") navigateToScreen("doubleSlidingQuoteL3", data);
          else if (windowType === "two-fixed-two-sliding-window") navigateToScreen("twoFixedTwoSlidingQuoteL3", data);
          else if (windowType === "four-sliding-window") navigateToScreen("fourSlidingQuoteL3", data);
        } else {
          if (windowType === "fixed-sliding-window") navigateToScreen("fixedSlidingQuoteL2", data);
          else if (windowType === "double-sliding-window" || windowType === "Doble Corrediza") navigateToScreen("doubleSlidingQuoteL2", data);
        }
      }
    } else {
      navigateToScreen("doorL3", data);
    }
  };

  /* ---------- RENDER POR PANTALLA (calculadoras) ---------- */
  if (currentScreen === "fixedSlidingL3") {
    return (
      <WindowCalculator
        onBack={goBack}
        onBackToNotes={navigationData.fromNotes ? () => navigateToScreen("notes") : undefined}
        initialWidth={navigationData.initialWidth}
        initialHeight={navigationData.initialHeight}
        showNotesButton={navigationData.fromNotes}
      />
    );
  }
  if (currentScreen === "doubleSlidingL3") {
    return (
      <XXCalculator
        onBack={goBack}
        onBackToNotes={navigationData.fromNotes ? () => navigateToScreen("notes") : undefined}
        initialWidth={navigationData.initialWidth}
        initialHeight={navigationData.initialHeight}
        showNotesButton={navigationData.fromNotes}
        line="L3"
      />
    );
  }
  if (currentScreen === "twoFixedTwoSlidingL3") {
    return (
      <TwoFixedTwoSlidingCalculator
        onBack={goBack}
        onBackToNotes={navigationData.fromNotes ? () => navigateToScreen("notes") : undefined}
        initialWidth={navigationData.initialWidth}
        initialHeight={navigationData.initialHeight}
        showNotesButton={navigationData.fromNotes}
      />
    );
  }
  if (currentScreen === "fourSlidingL3") {
    return (
      <FourSlidingCalculator
        onBack={goBack}
        onBackToNotes={navigationData.fromNotes ? () => navigateToScreen("notes") : undefined}
        initialWidth={navigationData.initialWidth}
        initialHeight={navigationData.initialHeight}
        showNotesButton={navigationData.fromNotes}
      />
    );
  }
  if (currentScreen === "fixedSlidingL2") {
    return (
      <WindowCalculatorLine2
        onBack={goBack}
        onBackToNotes={navigationData.fromNotes ? () => navigateToScreen("notes") : undefined}
        initialWidth={navigationData.initialWidth}
        initialHeight={navigationData.initialHeight}
        showNotesButton={navigationData.fromNotes}
      />
    );
  }
  if (currentScreen === "doubleSlidingL2") {
    return (
      <XXCalculator
        onBack={goBack}
        onBackToNotes={navigationData.fromNotes ? () => navigateToScreen("notes") : undefined}
        initialWidth={navigationData.initialWidth}
        initialHeight={navigationData.initialHeight}
        showNotesButton={navigationData.fromNotes}
        line="L2"
      />
    );
  }
  if (currentScreen === "doorL3") {
    return (
      <DoorCalculator
        onBack={goBack}
        initialWidth={navigationData.initialWidth}
        initialHeight={navigationData.initialHeight}
        initialDrag=""
      />
    );
  }
  if (currentScreen === "fixedSlidingQuoteL3") {
    return (
      <FixedSlidingCalculator
        onBack={goBack}
        onBackToNotes={navigationData.fromNotes ? () => navigateToScreen("notes") : undefined}
        initialWidth={navigationData.initialWidth}
        initialHeight={navigationData.initialHeight}
        showNotesButton={navigationData.fromNotes}
      />
    );
  }
  if (currentScreen === "doubleSlidingQuoteL3") {
    return (
      <DoubleSlidingQuoteCalculator
        onBack={goBack}
        onBackToNotes={navigationData.fromNotes ? () => navigateToScreen("notes") : undefined}
        initialWidth={navigationData.initialWidth}
        initialHeight={navigationData.initialHeight}
        showNotesButton={navigationData.fromNotes}
      />
    );
  }
  if (currentScreen === "twoFixedTwoSlidingQuoteL3") {
    return (
      <TwoFixedTwoSlidingQuoteCalculator
        onBack={goBack}
        onBackToNotes={navigationData.fromNotes ? () => navigateToScreen("notes") : undefined}
        initialWidth={navigationData.initialWidth}
        initialHeight={navigationData.initialHeight}
        showNotesButton={navigationData.fromNotes}
      />
    );
  }
  if (currentScreen === "fourSlidingQuoteL3") {
    return (
      <FourSlidingQuoteCalculator
        onBack={goBack}
        onBackToNotes={navigationData.fromNotes ? () => navigateToScreen("notes") : undefined}
        initialWidth={navigationData.initialWidth}
        initialHeight={navigationData.initialHeight}
        showNotesButton={navigationData.fromNotes}
      />
    );
  }
  if (currentScreen === "fixedSlidingQuoteL2") {
    return (
      <FixedSlidingQuoteCalculatorLine2
        onBack={goBack}
        onBackToNotes={navigationData.fromNotes ? () => navigateToScreen("notes") : undefined}
        initialWidth={navigationData.initialWidth}
        initialHeight={navigationData.initialHeight}
        showNotesButton={navigationData.fromNotes}
      />
    );
  }
  if (currentScreen === "doubleSlidingQuoteL2") {
    return (
      <DoubleSlidingQuoteCalculatorLine2
        onBack={goBack}
        onBackToNotes={navigationData.fromNotes ? () => navigateToScreen("notes") : undefined}
        initialWidth={navigationData.initialWidth}
        initialHeight={navigationData.initialHeight}
        showNotesButton={navigationData.fromNotes}
      />
    );
  }
  if (currentScreen === "windows") {
    return <WindowSubmenu onClose={goBack} onNavigateToCalculator={handleNavigateToCalculator} />;
  }
  if (currentScreen === "doors") {
    return <DoorSubmenu onBack={goBack} onNavigateToCalculator={handleNavigateToCalculator} />;
  }
  if (currentScreen === "quote") {
    return <QuoteSubmenu onBack={goBack} onNavigateToScreen={navigateToScreen} />;
  }
  if (currentScreen === "notes") {
    return <Notes onBack={goBack} onNavigateToCalculator={handleNavigateToCalculator} />;
  }
  if (currentScreen === "priceDatabase") {
    return <PriceDatabase onBack={goBack} />;
  }
  if (currentScreen === "windowQuote") {
    return <WindowQuoteCalculator onBack={goBack} />;
  }
  if (currentScreen === "generalQuote") {
    return <GeneralQuoteCalculator onBack={goBack} />;
  }
  if (currentScreen === "quoteSheetHome") {
    return (
      <QuoteSheetHome
        onBack={goBack}
        onOpenSavedSheets={() => {
          // aquí luego abriremos el listado de hojas guardadas
        }}
        onEditFixedData={() => {
          // aquí luego abriremos el cuestionario 1 (datos fijos)
        }}
        onNewQuoteSheet={() => {
          // aquí luego abriremos el cuestionario 2 + preview
        }}
      />
    );
  }

  // Helpers para UI del drawer
  const formatExpiry = () => {
    let ms = Number(userDoc?.expiryTimeMillis ?? 0);
    let st: string = String(userDoc?.lastPlayState?.subscriptionState ?? "");

    if (!Number.isFinite(ms) || ms <= 0) {
      const off = loadOfflineSub(user?.uid, user?.email ?? undefined);
      if (off) {
        ms = Number(off.expiryTimeMillis ?? 0);
        st = String(off.subscriptionState ?? "");
      }
    }

    if (!Number.isFinite(ms) || ms <= 0) return { label: "Fecha", value: "—" };

    const dt = new Date(ms);
    const fecha = dt.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
    const hora = dt.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", hour12: true });
    const canceledLike = /CANCEL|EXPIRE|ON_HOLD|PAUSE/i.test(st);
    const label = canceledLike ? "Fecha de fin de suscripción:" : "Fecha de renovación automática:";
    return { label, value: `${fecha} - ${hora}` };
  };

  const openManageSubscriptions = async () => {
    const url = `https://play.google.com/store/account/subscriptions?package=${PACKAGE_NAME}`;
    await openExternal(url);
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      if (auth.currentUser) {
        try { await releaseDeviceLock(auth.currentUser.uid); } catch {}
      }
      await signOut(auth);
      setDrawerOpen(false);
      nav("/", { replace: true });
    } catch {}
  };

  const handleCloseTray = async () => {
    setTrayOpen(false);
    try {
      const auth = getAuth();
      const u = auth.currentUser;
      if (u) {
        const db = getFirestore();
        await updateDoc(doc(db, "users", u.uid), {
          lastSeenAnnouncementsAt: serverTimestamp(),
        });
        setUnreadCount(0);
      }
    } catch {}
  };

  // Datos cuenta
  const { label, value } = formatExpiry();
  const photo = user?.photoURL || "";
  const displayName = user?.displayName || "Cuenta sin nombre";
  const email = user?.email || "";

  // Pantalla principal
  return (
    <div className="min-h-screen bg-[#043464] flex flex-col items-center relative overflow-hidden">
      {/* 🔄 Auto-backup silencioso: solo se monta cuando hay usuario */}
      {user && <AutoBackupMount />}

      {/* Barra superior con engrane + Bold + campanita (sin casita) */}
      <div className="w-full pt-6 px-6 flex items-center justify-between">
        <button
          className={`mm-gear ${drawerOpen ? "is-open" : ""}`}
          aria-label="Abrir ajustes"
          onClick={(e) => {
            e.stopPropagation();
            setDrawerOpen((o) => !o);
          }}
        >
          <Settings className="mm-gear-icon" />
        </button>

        <div className="mm-top-right">
          <BoldBackupMenu onGenerate={handleGenerateBackup} onRestore={handleRestoreBackup} />

          {/* 🔔 Campanita con badge */}
          <button
            onClick={() => setTrayOpen(true)}
            aria-label="Bandeja de mensajes"
            style={{ background: "transparent", border: 0, position: "relative", lineHeight: 0 }}
          >
            <Bell size={26} color="#fff" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  background: "#e11",
                  color: "#fff",
                  fontSize: 11,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  display: "grid",
                  placeItems: "center",
                  padding: "0 4px",
                  fontWeight: 800,
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="text-center my-16">
        <h1 className="text-white text-5xl font-bold mb-2">¿QUE VAMOS A</h1>
        <h1 className="text-white text-5xl font-bold">TRABAJAR?</h1>
      </div>

      <div className="w-full max-w-2xl px-4">
        <MenuButton
          icon={WindowIcon}
          title="VENTANAS"
          subtitle="LÍNEA NACIONAL DE 3"
          isCustomIcon
          onClick={() => navigateToScreen("windows")}
        />
        <MenuButton icon={Door} title="PUERTAS" subtitle="LÍNEA NACIONAL DE 3" onClick={() => navigateToScreen("doors")} />
        <MenuButton icon={ClipboardList} title="COTIZACION" subtitle="LÍNEA NACIONAL DE 3" onClick={() => navigateToScreen("quote")} />
        <MenuButton icon={NotebookPen} title="NOTAS" subtitle="" onClick={() => navigateToScreen("notes")} />
      </div>

      {/* Overlay */}
      <div className={`mm-overlay ${drawerOpen ? "visible" : ""}`} onClick={() => setDrawerOpen(false)} />

      {/* Drawer lateral */}
      <aside className={`mm-drawer ${drawerOpen ? "show" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div>
          {/* Título del drawer (sin casita) */}
          <div className="mm-drawer-title" style={{ marginBottom: 10 }}>AL Calculadora</div>

          {/* Cuenta — feedback sin hundimiento */}
          <Pressable className="mm-row" noTranslate>
            {photo ? (
              <img src={photo} alt="avatar" className="mm-acc-avatar" referrerPolicy="no-referrer" />
            ) : (
              <div className="mm-acc-avatar mm-acc-initial">{displayName.substring(0, 1).toUpperCase()}</div>
            )}
            <div>
              <div className="mm-acc-name">{displayName}</div>
              <div className="mm-acc-mail">{email}</div>
            </div>
          </Pressable>

          <div className="mm-divider" />

          {/* Fecha — feedback sin hundimiento */}
          <Pressable className="mm-row" noTranslate>
            <img src={ICONS.alert} alt="Alerta" className="mm-icon" />
            <div>
              <div className="mm-info-label">{label}</div>
              <div className="mm-info-date">{value}</div>
            </div>
          </Pressable>

          <div className="mm-divider" />

          {/* Banner curso (clic en imagen) */}
          <Pressable
            onClick={() => openExternal(COURSE_URL)}
            rounded={16}
            aria-label="Abrir curso de ayuda"
          >
            <img
              src={ICONS.curso}
              alt="Aprende a utilizar la app"
              style={{ width: "100%", borderRadius: 16, display: "block" }}
            />
          </Pressable>

          {/* Título bajo el banner */}
          <Pressable
            onClick={() => openExternal(COURSE_URL)}
            noShadow
            noTranslate
            style={{
              fontWeight: 800,
              textTransform: "uppercase",
              marginTop: 10,
              marginBottom: 10,
              color: "#fff",
              background: "transparent",
              border: 0,
              width: "100%",
              textAlign: "center",
              letterSpacing: 0.2,
            }}
            aria-label="Abrir curso de ayuda"
          >
            APRENDE A UTILIZAR LA APP!!
          </Pressable>

          {/* Cancelar suscripción */}
          <div className="mm-divider" />
          <Pressable className="mm-action mm-row danger" onClick={openManageSubscriptions}>
            <img src={ICONS.tarjeta} alt="Cancelar" className="mm-icon" />
            <div>
              <div className="mm-action-title">Cancelar suscripción.</div>
              <div className="mm-action-sub">Abrir gestión de suscripciones</div>
            </div>
          </Pressable>

          <div className="mm-divider" />

          {/* WhatsApp ayuda */}
          <Pressable className="mm-action mm-row" onClick={() => openExternal(WHATS_URL)}>
            <img src={ICONS.whats} alt="WhatsApp" className="mm-icon" />
            <div>
              <div className="mm-action-title">¿Necesitas ayuda?</div>
            </div>
          </Pressable>

          {/* 👉 Nuevo: Grupo exclusivo */}
          <div className="mm-divider" />
          <Pressable className="mm-action mm-row" onClick={() => openExternal(GROUP_URL)}>
            <img src={ICONS.grupo} alt="Grupo exclusivo" className="mm-icon" />
            <div>
              <div className="mm-action-title">Grupo exclusivo</div>
              <div className="mm-action-sub">Recibe tips y ayudas</div>
            </div>
          </Pressable>

          <div className="mm-divider" />

          {/* Cerrar sesión */}
          <Pressable className="mm-action mm-row" onClick={() => setShowLogoutConfirm(true)}>
            <img src={ICONS.salida} alt="Salir" className="mm-icon" />
            <div>
              <div className="mm-action-title">Cerrar sesión en esta cuenta.</div>
            </div>
          </Pressable>
        </div>

        {/* Footer links */}
        <div className="mm-footer-links">
          <button className="mm-link" onClick={() => openExternal(PRIVACY_URL)}>
            Política de privacidad.
          </button>
          <span className="mm-sep">|</span>
          <button className="mm-link" onClick={() => (window.location.href = REPORTS_MAILTO)}>
            Reportes.
          </button>
          <span className="mm-sep">|</span>
          <button className="mm-link" onClick={() => openExternal(CONTACT_WHATS)}>
            Contáctanos.
          </button>
        </div>

        {/* Modal de confirmación de cierre de sesión */}
        {showLogoutConfirm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "grid",
              placeItems: "center",
              zIndex: 50,
            }}
            onClick={() => setShowLogoutConfirm(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "86%",
                maxWidth: 360,
                background: "#ffffff",
                color: "#0b1b32",
                borderRadius: 12,
                padding: "16px 16px 12px",
                boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>¿Seguro que quieres cerrar sesión?</div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid #c8d1e1",
                    padding: "8px 14px",
                    borderRadius: 8,
                    fontWeight: 700,
                  }}
                >
                  No
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "#1454b4",
                    color: "#fff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 8,
                    fontWeight: 700,
                  }}
                >
                  Sí
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* 🔔 Bandeja de mensajes */}
      <MessageTray open={trayOpen} onClose={handleCloseTray} messages={trayMessages} />
    </div>
  );
};

export default MainMenu;
