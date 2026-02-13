// src/plugins/time-settings.ts
import { registerPlugin } from "@capacitor/core";

export interface TimeSettingsPlugin {
  isAutoTimeEnabled(): Promise<{ enabled: boolean }>;
  openDateSettings(): Promise<void>;
}

// 👇 MUY IMPORTANTE: el nombre debe ser EXACTAMENTE "TimeSettings"
// porque así lo anotamos en el plugin Java con @CapacitorPlugin(name = "TimeSettings")
export const TimeSettings = registerPlugin<TimeSettingsPlugin>("TimeSettings", {
  // Opcional: fallback web para no romper en navegador
  web: {
    async isAutoTimeEnabled() { return { enabled: true }; },
    async openDateSettings() { throw new Error("plugin_not_available"); },
  } as any,
});
