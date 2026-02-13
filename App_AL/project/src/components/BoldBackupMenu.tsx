// src/components/BoldBackupMenu.tsx
import React, { useEffect, useRef, useState } from "react";
import { BackupRestoreIcon } from "./BackupRestoreIcon";
import { createLogger } from "../lib/logger";

type Props = {
  onGenerate: () => Promise<void>;
  onRestore: () => Promise<void>;
};

const BoldBackupMenu: React.FC<Props> = ({ onGenerate, onRestore }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"gen" | "res" | null>(null);
  const [spin, setSpin] = useState<"half" | "full" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const log = createLogger("backup:menu");

  useEffect(() => {
    log.info("Mount BoldBackupMenu");
    return () => log.info("Unmount BoldBackupMenu");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (open) {
          log.info("Click outside → cerrar popover");
          setOpen(false);
          setSpin("full"); // al cerrar, giro completo
          window.setTimeout(() => setSpin(null), 450);
        }
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, log]);

  const handleToggle = () => {
    const next = !open;
    log.info("Toggle popover →", next ? "open" : "close");
    setOpen(next);
    // 180° al abrir, 360° al cerrar
    setSpin(next ? "half" : "full");
    window.setTimeout(() => setSpin(null), next ? 260 : 450);
  };

  const handleGenerate = async () => {
    log.info("Click: Generar copia");
    try {
      setLoading("gen");
      log.time("generate");
      await onGenerate();
      log.info("Generar copia → OK");
      log.timeEnd("generate");
    } catch (e) {
      log.error("Generar copia → ERROR", e);
      alert("Ocurrió un error al generar/subir la copia.");
      try { log.timeEnd("generate"); } catch {}
    } finally {
      setLoading(null);
      setOpen(false);
      setSpin("full");
      window.setTimeout(() => setSpin(null), 450);
    }
  };

  const handleRestore = async () => {
    log.info("Click: Restablecer copia");
    try {
      setLoading("res");
      log.time("restore");
      await onRestore();
      log.info("Restablecer copia → FIN (ver resultado en alert/recarga)");
      log.timeEnd("restore");
    } catch (e) {
      log.error("Restablecer copia → ERROR", e);
      alert("Ocurrió un error al restaurar la copia.");
      try { log.timeEnd("restore"); } catch {}
    } finally {
      setLoading(null);
      setOpen(false);
      setSpin("full");
      window.setTimeout(() => setSpin(null), 450);
    }
  };

  return (
    <div ref={ref} className="mm-bold-wrap">
      <button
        aria-label="Opciones de respaldo"
        className="mm-bold-btn"
        onClick={handleToggle}
      >
        <BackupRestoreIcon size={28} spin={spin} />
      </button>

      {open && (
        <div className="mm-bold-popover">
          {/* 🔹 Título informativo (solo visual) */}
          <div
            style={{
              fontWeight: 800,
              fontSize: 14,
              color: "#0b1b32",
              padding: "10px 14px 8px",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
              marginBottom: 6,
            }}
          >
            ✅ Copia automática cada 24hrs
          </div>

          <button
            className="mm-bold-item"
            onClick={handleGenerate}
            disabled={loading !== null}
          >
            <span className="mm-bold-dot dl">{loading === "gen" ? "…" : "↑"}</span>
            <div>
              <div className="mm-bold-title">Generar copia</div>
              <div className="mm-bold-sub">Ideal si vas a cambiar de teléfono.</div>
            </div>
          </button>

          <button
            className="mm-bold-item"
            onClick={handleRestore}
            disabled={loading !== null}
          >
            <span className="mm-bold-dot rs">{loading === "res" ? "…" : "↺"}</span>
            <div>
              <div className="mm-bold-title">Restablecer copia</div>
              <div className="mm-bold-sub">Restaura solo si es necesario.</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default BoldBackupMenu;
