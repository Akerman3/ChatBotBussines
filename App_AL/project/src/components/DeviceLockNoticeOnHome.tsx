import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const DEVICE_FLAG = "alcalc.deviceLockNotice.v1";

type DeviceLockData = {
  message?: string;
};

export default function DeviceLockNoticeOnHome() {
  const { pathname } = useLocation();
  const isHome = pathname === "/" || pathname === "/home";

  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<DeviceLockData | null>(null);

  useEffect(() => {
    if (!isHome) return;
    try {
      const raw = localStorage.getItem(DEVICE_FLAG);
      if (raw) {
        const obj = JSON.parse(raw) as DeviceLockData;
        setData(obj || {});
        setVisible(true);
        // Importante: NO borrar aquí. Se borra al pulsar "OK".
      }
    } catch {
      /* noop */
    }
  }, [isHome]);

  if (!isHome || !visible) return null;

  const msg =
    (data?.message && String(data.message).trim()) ||
    `Esta cuenta ya se encuentra abierta en otro dispositivo.
Para usarla en este dispositivo, cierra sesión en el dispositivo que actualmente tiene la sesión abierta.
NOTA: Para que la sesión cierre correctamente, asegúrate de que ese dispositivo tenga acceso a internet antes o después de cerrar la sesión.
Si presentas problemas con tu cuenta, contacta con el soporte de AL Calculadora.`;

  const closeAndClear = () => {
    try {
      localStorage.removeItem(DEVICE_FLAG);
    } catch {
      /* noop */
    }
    setVisible(false);
  };

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
      onClick={closeAndClear}
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
        <div style={{ fontSize: 15, lineHeight: 1.45, marginBottom: 16, whiteSpace: "pre-line" }}>
          {msg}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={closeAndClear}
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
