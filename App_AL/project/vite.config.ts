import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // 👇 Este "base" hace que todo use rutas relativas en el build
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      // Esto mantiene la exclusión del plugin nativo en build web
      external: ["capacitor-billing"]
    }
  }
});
