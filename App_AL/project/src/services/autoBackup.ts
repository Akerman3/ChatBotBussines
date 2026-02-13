// src/services/autoBackup.ts
import { uploadBackup } from "../lib/cloudBackup";
// OJO: esta ruta debe coincidir con tu util real
import { getBackupJsonString } from "../utils/backupManager";

/**
 * Ejecuta un backup silencioso:
 * - Genera el JSON con tu utilidad actual
 * - Sube con uploadBackup (que ya usa latest.json)
 * - No muestra UI ni toasts; solo logs en consola
 * Devuelve true si subió OK, false en cualquier fallo.
 */
export async function runAutoBackupSilently(): Promise<boolean> {
  try {
    const res = getBackupJsonString();
    if (!res?.success || !res?.jsonString) {
      console.warn("[autoBackup] No se pudo generar JSON:", res?.message);
      return false;
    }
    await uploadBackup(res.jsonString);
    console.log("[autoBackup] Backup subido correctamente (silencioso).");
    return true;
  } catch (err) {
    console.warn("[autoBackup] Error al subir backup:", err);
    return false;
  }
}
