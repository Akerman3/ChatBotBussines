/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL pública de tu Cloud Function proxy (p.ej. https://us-central1-tu-proyecto.cloudfunctions.net/backupGetLatest) */
  readonly VITE_BACKUP_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

