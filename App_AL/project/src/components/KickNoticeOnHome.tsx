// src/components/KickNoticeOnHome.tsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const KICK_FLAG = "alcalc.kickNotice";

type KickData = {
  expiryTimeMillis: number;
  label?: string;
};

function formatEsMx(ms: number) {
  const dt = new Date(ms);
  const fecha = dt.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const hora = dt.toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${fecha} - ${hora}`;
}

export default function KickNoticeOnHome() {
  const { pathname } = useLocation();
  const [data, setData] = useState<KickData | null>(null);
  const [visible, setVisible] = useState(false);

  // Solo en Home (/, /home)
  const isHome = pathname === "/" || pathname === "/home";

  useEffect(() => {
    if (!isHome) return;

    try {
      const raw = sessionStorage.getItem(KICK_FLAG);
      if (!raw) return;
      const obj = JSON.parse(raw) as KickData;
      if (obj && Number.isFinite(obj.expiryTimeMillis) && obj.expiryTimeMillis > 0) {
        setData(obj);
        setVisible(true);
      }
      // Limpiar para que sea “una sola vez”
      sessionStorage.removeItem(KICK_FLAG);
    } catch {
      // ignora
    }
  }, [isHome]);

  if (!isHome || !visible || !data) return null;

  const label = (data.label || "").toLowerCase();
  const palabra =
    label.includes("renovación") ? "renovación" :
    label.includes("fin de suscripción") ? "cancelación" :
    "renovación/cancelación";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
      }}
      onClick={() => setVisible(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90%",
          maxWidth: 420,
          background: "#1f2937",
          color: "#e5e7eb",
          borderRadius: 16,
          padding: "18px 16px 14px",
          boxShadow: "0 14px 38px rgba(0,0,0,0.55)",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
          AL Calculadora
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.45, marginBottom: 16 }}>
          Estimado usuario, la fecha de {palabra} es el día {" "}
          <strong>({formatEsMx(data.expiryTimeMillis)})</strong>, por favor
          inicie sesión en su cuenta nuevamente para validar sus datos.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => setVisible(false)}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: 0,
              padding: "10px 16px",
              borderRadius: 10,
              fontWeight: 800,
              minWidth: 96,
            }}
            aria-label="Cerrar aviso"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
