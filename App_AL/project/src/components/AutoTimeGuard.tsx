// AutoTimeGuard.tsx  — REEMPLAZO COMPLETO
import React, { useEffect, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import InfoModal from "./InfoModal"; // ⟵ agregado

const openSettingsWithCordova = async () => {
  const w = window as any;
  if (w.cordova?.plugins?.settings?.open) {
    await new Promise<void>((resolve, reject) => {
      w.cordova.plugins.settings.open(
        "date",
        () => resolve(),
        () =>
          w.cordova.plugins.settings.open(
            "settings",
            () => resolve(),
            (e: any) => reject(e)
          )
      );
    });
  } else {
    throw new Error("cordova plugin not available");
  }
};

const AutoTimeGuard: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false); // ⟵ agregado (modal ?)

  // aplica estado: true = reloj automático activo -> ocultar hoja
  const applyEnabled = (enabled: boolean) => setVisible(!enabled);

  useEffect(() => {
    // 1) Escucha el evento emitido por MainActivity
    const handler = (e: Event) => {
      const anyEvt = e as CustomEvent<{ enabled: boolean }>;
      const enabled = !!anyEvt?.detail?.enabled;
      console.log("[AutoTimeGuard] alAutoTime event -> enabled=", enabled);
      applyEnabled(enabled);
    };
    window.addEventListener("alAutoTime", handler as EventListener);

    // 2) En 'resume', el MainActivity ya re-emite el estado; por seguridad hacemos un re-chequeo retrasado
    const sub = CapacitorApp.addListener("resume", () => {
      // MainActivity emite inmediatamente; aquí sólo esperamos 500ms y confiamos en el evento
      setTimeout(() => {
        // no hacemos nada aquí; el evento ya habrá llegado
      }, 500);
    });

    return () => {
      window.removeEventListener("alAutoTime", handler as EventListener);
      sub.remove();
    };
  }, []);

  const handleOpenSettings = async () => {
    try {
      await openSettingsWithCordova();
      // Al volver, MainActivity.onResume emitirá el evento con el estado actualizado.
    } catch (e) {
      console.warn("[AutoTimeGuard] cordova-open-native-settings falló:", e);
      alert("No se pudo abrir Ajustes de fecha y hora. Ábrelo desde Configuración del teléfono.");
    }
  };

  if (!visible) return null;

  return (
    <div className="autotime-backdrop" onClick={(e) => e.stopPropagation()}>
      {/* ⇩ añadí borderRadius para redondear también las esquinas inferiores */}
      <div className="autotime-sheet" style={{ borderRadius: 16 }}>
        <div className="autotime-sheet__content">
          <div className="autotime-sheet__title">ALcalculadora</div>
          <div className="autotime-sheet__text">
            ALcalculadora necesita permiso para activar la fecha y hora automática en este dispositivo
          </div>
          <div className="autotime-sheet__actions">
            {/* ⇩ botón ? abre el InfoModal; stopPropagation lo maneja el modal */}
            <button
              className="autotime-btn autotime-btn--icon"
              aria-label="Ayuda"
              onClick={(e) => {
                e.stopPropagation();
                setInfoOpen(true);
              }}
            >
              ?
            </button>
            <button className="autotime-btn autotime-btn--ok" onClick={handleOpenSettings}>
              OK
            </button>
          </div>
        </div>
      </div>

      {/* Modal informativo (solo cierra con OK) */}
      <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
};

export default AutoTimeGuard;
