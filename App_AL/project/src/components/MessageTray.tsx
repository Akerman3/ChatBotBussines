// src/components/MessageTray.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { App as CapacitorAppClass } from "@capacitor/app";

type Message = {
  id: string;
  title?: string;        // Ej: "AL Calculadora"
  body: string;          // Puede contener "@user"
  createdAt: Date;       // Fecha de creación
  isNew: boolean;        // true = punto verde, false = rojo
  buttons?: Array<{      // 🔹 NUEVO: Botones con enlaces
    label: string;
    url: string;
  }>;
};

interface Props {
  open: boolean;
  onClose: () => void;
}

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

/** NUEVO: convierte URLs, emails y teléfonos en <a> clicables sin permitir HTML crudo */
function linkify(text: string) {
  const parts: (string | JSX.Element)[] = [];
  const regex =
    /((https?:\/\/|www\.)[^\s<]+)|([\w.+-]+@[\w-]+\.[\w.-]+)|(\b(?:tel:)?\+?\d[\d\s().-]{6,}\d\b)/gi;

  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));

    const match = m[0];
    // URL
    if (m[1]) {
      const href = match.startsWith("http") ? match : `https://${match}`;
      parts.push(
        <a key={parts.length} href={href} target="_blank" rel="noopener noreferrer">
          {match}
        </a>
      );
    // email
    } else if (m[3]) {
      parts.push(
        <a key={parts.length} href={`mailto:${match}`}>
          {match}
        </a>
      );
    // teléfono
    } else if (m[4]) {
      const digits = match.replace(/\s/g, "");
      const href = digits.startsWith("tel:") ? digits : `tel:${digits}`;
      parts.push(
        <a key={parts.length} href={href}>
          {match}
        </a>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

/** Formatea "hace 30min / 2hrs / 19/sep/2025" */
function formatRelativeEs(d: Date): string {
  const now = Date.now();
  const diff = Math.max(0, now - d.getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}hrs`;
  const dd = d
    .toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
    .replace(".", "");
  return `(${dd})`;
}

const MessageTray: React.FC<Props> = ({ open, onClose }) => {
  // Estado local por tarjeta: expandido
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // Si un mensaje realmente desborda las 3 líneas -> muestra "ver más…"
  const [needsClamp, setNeedsClamp] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [hasNew, setHasNew] = useState(false); // para marcar vistos al cerrar

  const overlayRef = useRef<HTMLDivElement>(null);

  // Refs a los <p> de cada tarjeta para medir overflow
  const paraRefs = useRef<Record<string, HTMLParagraphElement | null>>({});

  // Cierra con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Lee anuncios cuando está abierto
  useEffect(() => {
    if (!open) return;
    const auth = getAuth();
    const u = auth.currentUser;
    if (!u) { setMessages([]); return; }

    const db = getFirestore();

    // 1) Leer lastSeen del usuario
    let lastSeen: number | null = null;
    const userRef = doc(db, "users", u.uid);
    const stopUser = onSnapshot(userRef, (snap) => {
      const d = snap.data() as any;
      const ts: Timestamp | undefined = d?.lastSeenAnnouncementsAt;
      lastSeen = ts?.toMillis?.() ?? null;
    });

    // 2) Escuchar anuncios visibles
    const q = query(
      collection(db, "announcements"),
      where("isDeleted", "==", false),
      orderBy("createdAt", "desc"),
      limit(25)
    );

    // 🆕 Obtener fecha de creación de cuenta del usuario
    const userCreationDate = u.metadata?.creationTime 
      ? new Date(u.metadata.creationTime).getTime() 
      : 0;

    const stopMsgs = onSnapshot(q, (snap) => {
      const displayName = u.displayName?.trim();
      const emailName = u.email?.split("@")[0] ?? "usuario";
      const friendly = displayName && displayName.length > 0 ? displayName : emailName;

      const items: Message[] = [];
      
      snap.docs.forEach((d) => {
        const data = d.data() as any;
        const created = (data.createdAt as Timestamp | undefined)?.toDate?.() ?? new Date();
        const ms = created.getTime();
        
        // 🆕 FILTRO 1: Solo mostrar mensajes posteriores a la fecha de registro del usuario
        if (userCreationDate > 0 && ms > 0 && ms < userCreationDate) {
          return; // Saltar este mensaje (es anterior al registro)
        }

        // 🆕 FILTRO 2: Sistema de destinatarios
        const destinatarios = data?.destinatarios;
        let isForThisUser = false;

        if (!destinatarios) {
          // Si no existe el campo, es para todos (retrocompatibilidad)
          isForThisUser = true;
        } else if (Array.isArray(destinatarios)) {
          // Si es un array, verificar si contiene "Todos" o el UID del usuario
          if (destinatarios.includes("Todos") || destinatarios.includes(u.uid)) {
            isForThisUser = true;
          }
        } else if (typeof destinatarios === "string") {
          // Retrocompatibilidad: si es string, verificar si dice "Todos" o contiene el UID
          if (destinatarios === "Todos" || destinatarios.includes(u.uid)) {
            isForThisUser = true;
          }
        }

        // Si el mensaje no es para este usuario, no lo agregamos
        if (!isForThisUser) {
          return;
        }

        // Mensaje pasa todos los filtros, procesarlo
        const body: string = String(data.body ?? "")
          .replaceAll("@@user", "@user")
          .replaceAll("@user", friendly);

        const isNew = lastSeen ? ms > lastSeen : true;

        // 🔹 Incluir botones si existen en el documento
        const buttons = data?.buttons && Array.isArray(data.buttons)
          ? data.buttons.map((btn: any) => ({
              label: String(btn?.label || ""),
              url: String(btn?.url || "")
            })).filter((btn: any) => btn.label && btn.url)
          : undefined;

        items.push({
          id: d.id,
          title: "AL Calculadora",
          body,
          createdAt: created,
          isNew,
          buttons,
        });
      });

      setMessages(items);
      setHasNew(items.some((m) => m.isNew));
    });

    return () => {
      stopMsgs();
      stopUser();
    };
  }, [open]);

  // Calcula cuáles párrafos necesitan "ver más…" (realmente desbordan 3 líneas)
  const recomputeClamp = () => {
    if (!messages) return;
    const next: Record<string, boolean> = {};
    for (const m of messages) {
      const el = paraRefs.current[m.id];
      if (!el) continue;
      // Si el contenido total (scrollHeight) supera el alto disponible (clientHeight),
      // entonces hay truncado y necesitamos mostrar "ver más…"
      const need = el.scrollHeight > el.clientHeight + 1;
      next[m.id] = need;
    }
    setNeedsClamp(next);
  };

  // Recalcular cuando cambian mensajes, expand/collapse o se abre la bandeja
  useEffect(() => {
    if (!open) return;
    // dar un microtiempo para que layout aplique estilos/clamp
    const t = setTimeout(recomputeClamp, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, expanded, open]);

  // Recalcular también en resize (por si cambia el ancho de la tarjeta)
  useEffect(() => {
    if (!open) return;
    const onResize = () => recomputeClamp();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, messages]);

  // Cierra tocando fuera
  const handleOverlayClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === overlayRef.current) handleClose();
  };

  // Al cerrar: si había nuevos, marca vistos
  const handleClose = async () => {
    try {
      if (hasNew) {
        const auth = getAuth();
        const u = auth.currentUser;
        if (u) {
          const db = getFirestore();
          const userRef = doc(db, "users", u.uid);
          await updateDoc(userRef, { lastSeenAnnouncementsAt: serverTimestamp() });
        }
      }
    } catch { /* noop */ }
    onClose();
  };

  const demo = useMemo(() => messages ?? undefined, [messages]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 60,
        padding: "16px",
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "92%",
          maxWidth: 680,
          height: "78vh",
          background: "#ffffff",
          color: "#0b1b32",
          borderRadius: 18,
          boxShadow: "0 14px 38px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "14px 16px 8px" }}>
          <button
            onClick={handleClose}
            aria-label="Cerrar bandeja"
            style={{ background: "transparent", border: 0, lineHeight: 0, marginRight: 8 }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#0b1b32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Bandeja de mensajes.</div>
        </div>

        {/* Contenido scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px 14px" }}>
          {!demo || demo.length === 0 ? (
            <div
              style={{
                height: "100%",
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  color: "#5a6a86",
                }}
              >
                <svg
                  width="96"
                  height="96"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ display: "block", opacity: 0.7, margin: "0 auto" }}
                >
                  <path d="M22 2L11 13" stroke="#5a6a86" strokeWidth="2" strokeLinecap="round" />
                  <path
                    d="M22 2l-7 20-4-9-9-4 20-7z"
                    stroke="#5a6a86"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div style={{ fontWeight: 700 }}>Aún no hay mensajes.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {demo.map((m) => {
                const isOpen = !!expanded[m.id];
                const showSeeMore = !isOpen && !!needsClamp[m.id];
                const showSeeLess = isOpen && !!needsClamp[m.id];

                return (
                  <div
                    key={m.id}
                    style={{
                      background: "#f3f5f9",
                      borderRadius: 12,
                      padding: 12,
                      boxShadow: "0 1px 0 rgba(0,0,0,0.04) inset, 0 1px 2px rgba(0,0,0,0.06)",
                    }}
                  >
                    {/* Título + tiempo */}
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 8 }}>
                      <span
                        aria-hidden
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 9999,
                          background: m.isNew ? "#22c55e" : "#ef4444",
                          display: "inline-block",
                        }}
                      />
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{m.title ?? "AL Calculadora"}</div>
                      <div
                        style={{
                          marginLeft: 8,
                          fontSize: 12,
                          color: "#6b7a98",
                          fontWeight: 600,
                        }}
                      >
                        {formatRelativeEs(m.createdAt)}
                      </div>
                    </div>

                    {/* Cuerpo con clamp / ver más */}
                    <div
                      style={{
                        background: "#ffffff",
                        borderRadius: 8,
                        padding: 10,
                        border: "1px solid #d7deeb",
                        color: "#1a2a44",
                      }}
                    >
                      <p
                        ref={(el) => { paraRefs.current[m.id] = el; }}
                        style={{
                          margin: 0,
                          display: isOpen ? "block" : "-webkit-box",
                          WebkitLineClamp: isOpen ? ("unset" as any) : 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: "1.35",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {linkify(m.body)}
                      </p>

                      {(showSeeMore || showSeeLess) && (
                        <button
                          onClick={() => setExpanded((e) => ({ ...e, [m.id]: !isOpen }))}
                          style={{
                            marginTop: 6,
                            background: "transparent",
                            border: 0,
                            color: "#2b5ad6",
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          {isOpen ? "ver menos" : "ver más…"}
                        </button>
                      )}

                      {/* 🔹 NUEVO: Botones con enlaces (si existen) */}
                      {m.buttons && m.buttons.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            marginTop: 12,
                          }}
                        >
                          {m.buttons.map((button, index) => (
                            <button
                              key={index}
                              onClick={() => openExternal(button.url)}
                              style={{
                                background: "#1976d2",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: 8,
                                padding: "10px 16px",
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: "pointer",
                                textAlign: "center",
                                transition: "background 0.2s ease",
                              }}
                              onMouseDown={(e) => {
                                e.currentTarget.style.background = "#1565c0";
                              }}
                              onMouseUp={(e) => {
                                e.currentTarget.style.background = "#1976d2";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#1976d2";
                              }}
                            >
                              {button.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageTray;