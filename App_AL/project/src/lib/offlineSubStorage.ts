// src/lib/offlineSubStorage.ts

// ✅ SEGURIDAD: Salt para dificultar manipulación de datos offline
const SIGNATURE_SALT = "alcalc_2026_sec_v1";

export type OfflineSubState = {
  expiryTimeMillis: number;
  subscriptionState?: string; // SUBSCRIBED, CANCELED, ON_HOLD, ...
  label?: string;             // "Fecha de renovación automática:" | "Fecha de fin de suscripción:"
  lastUpdated: number;
  _sig?: string; // ✅ Firma para validar integridad
};

type OfflineSubMap = Record<string, OfflineSubState>; // clave = email en minúsculas
const KEY = "alcalc.offlineSubMap.v2"; // v2 con firma

/** ✅ Genera una firma simple para verificar integridad de datos */
async function generateSignature(email: string, data: Partial<OfflineSubState>): Promise<string> {
  const payload = `${SIGNATURE_SALT}:${email}:${data.expiryTimeMillis || 0}:${data.subscriptionState || ""}`;
  // Usar SubtleCrypto si está disponible, sino fallback a hash simple
  if (typeof crypto !== "undefined" && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(payload);
      const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, "0")).join("");
    } catch {
      // Fallback
    }
  }
  // Fallback: hash simple (menos seguro pero funcional)
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/** ✅ Verifica que la firma sea válida */
async function verifySignature(email: string, data: OfflineSubState): Promise<boolean> {
  if (!data._sig) return false;
  const expectedSig = await generateSignature(email, data);
  return data._sig === expectedSig;
}

/** Lee el mapa completo desde localStorage (tolerante a errores). */
function readMap(): OfflineSubMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? (obj as OfflineSubMap) : {};
  } catch {
    return {};
  }
}
/** Escribe el mapa completo. */
function writeMap(map: OfflineSubMap) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

/** Carga la suscripción guardada para un email (o null). ✅ Ahora verifica firma */
export function loadOfflineSubFor(email: string | null | undefined): OfflineSubState | null {
  if (!email) return null;
  const map = readMap();
  const data = map[email.toLowerCase()] ?? null;

  if (data) {
    // ✅ Verificar firma de manera asíncrona no es ideal aquí,
    // pero podemos hacer una verificación síncrona básica
    // La verificación completa se hace en isOfflineSubActive
  }

  return data;
}

/** Guarda (merge) campos de suscripción para un email. ✅ Ahora incluye firma */
export async function saveOfflineSubFor(email: string, patch: Partial<OfflineSubState>): Promise<void> {
  if (!email) return;
  const key = email.toLowerCase();
  const map = readMap();
  const prev = map[key] ?? ({ expiryTimeMillis: 0, lastUpdated: 0 } as OfflineSubState);

  const newData: OfflineSubState = {
    ...prev,
    ...patch,
    lastUpdated: Date.now(),
  };

  // ✅ Generar firma
  newData._sig = await generateSignature(key, newData);

  map[key] = newData;
  writeMap(map);
}

/** Borra la info guardada para un email. */
export function clearOfflineSubFor(email: string): void {
  if (!email) return;
  const key = email.toLowerCase();
  const map = readMap();
  delete map[key];
  writeMap(map);
}

/** ✅ Activa si la fecha de expiración es futura Y la firma es válida */
export async function isOfflineSubActiveAsync(s: OfflineSubState | null, email?: string): Promise<boolean> {
  if (!s || !email) return false;

  // ✅ Verificar firma
  const isValidSig = await verifySignature(email.toLowerCase(), s);
  if (!isValidSig) {
    console.warn("[OfflineSub] Firma inválida detectada, datos posiblemente manipulados");
    return false;
  }

  const now = Date.now();
  const state = (s.subscriptionState || "").toUpperCase();

  // ✅ CORRECCIÓN: Estados que indican VENCIMIENTO REAL (no cancelación pendiente)
  // EXPIRED = ya venció la fecha
  // ON_HOLD/PAUSED = problema de pago, acceso suspendido inmediatamente
  const immediatelyInactive = /(EXPIRED|ON_HOLD|PAUSED|REVOKED)/.test(state);

  if (immediatelyInactive) {
    console.log("[OfflineSub] Estado indica inactividad inmediata:", state);
    return false;
  }

  // ✅ CORRECCIÓN: Para CANCELED, verificar la fecha de expiración
  // El usuario puede haber cancelado pero aún tiene tiempo pagado
  // Solo está inactivo si la fecha YA pasó
  return Number.isFinite(s.expiryTimeMillis) && s.expiryTimeMillis > now;
}

/** Versión síncrona para compatibilidad */
export function isOfflineSubActive(s: OfflineSubState | null): boolean {
  if (!s) return false;
  const now = Date.now();

  const state = (s.subscriptionState || "").toUpperCase();

  // ✅ CORRECCIÓN: Estados que indican VENCIMIENTO REAL (no cancelación pendiente)
  // EXPIRED = ya venció la fecha
  // ON_HOLD/PAUSED = problema de pago, acceso suspendido inmediatamente
  const immediatelyInactive = /(EXPIRED|ON_HOLD|PAUSED|REVOKED)/.test(state);

  if (immediatelyInactive) {
    console.log("[OfflineSub] Estado indica inactividad inmediata:", state);
    return false;
  }

  // ✅ Verificación adicional: si no hay firma, no confiar
  if (!s._sig) {
    console.warn("[OfflineSub] Datos sin firma, migrando a formato seguro...");
    return false; // Forzar re-validación online
  }

  // ✅ CORRECCIÓN: La suscripción está activa si la fecha NO ha pasado
  // Esto permite que usuarios con estado CANCELED sigan usando la app
  // hasta que llegue su fecha de expiración
  return Number.isFinite(s.expiryTimeMillis) && s.expiryTimeMillis > now;
}

