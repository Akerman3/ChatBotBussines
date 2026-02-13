import { useEffect } from "react";

declare const window: any; // Para evitar errores de typescript

export function useBilling() {
  useEffect(() => {
    if (!window.cordova || !window.store) {
      console.warn("Cordova o Store no disponibles");
      return;
    }

    const store = window.store;

    // Log
    store.verbosity = store.DEBUG;

    // Registrar los productos
    store.register([
      {
        id: "premium.mensual", // Usa tu ID EXACTO de producto mensual
        type: store.PAID_SUBSCRIPTION,
      },
      {
        id: "premium.anual", // Usa tu ID EXACTO de producto anual
        type: store.PAID_SUBSCRIPTION,
      },
    ]);

    // Validar recibos (opcional, requiere backend)
    store.validator = "https://validator.fovea.cc"; // O tu propio backend

    // Evento cuando el producto está cargado
    store.when("product").updated((p: any) => {
      console.log("Producto actualizado:", p);
    });

    // Evento cuando la compra es aprobada
    store.when("product").approved((p: any) => {
      console.log("Compra aprobada:", p);
      p.finish();
    });

    // Error handler
    store.error((err: any) => {
      console.error("Error en compras:", err);
    });

    // Inicializar
    store.ready(() => {
      console.log("Store listo");
    });

    store.refresh();
  }, []);

  const subscribeMensual = () => {
    if (window.store) {
      const p = window.store.get("premium.mensual");
      if (p) p.order();
    }
  };

  const subscribeAnual = () => {
    if (window.store) {
      const p = window.store.get("premium.anual");
      if (p) p.order();
    }
  };

  return { subscribeMensual, subscribeAnual };
}
