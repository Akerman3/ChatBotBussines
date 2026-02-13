// src/utils/supabaseClient.ts
// 🔧 Stub temporal de Supabase para que el proyecto compile sin @supabase/supabase-js.
// NO usa ninguna dependencia externa. Cuando quieras usar Supabase de verdad,
// podrás volver a poner la versión original con createClient.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Definimos un tipo local para no depender de @supabase/supabase-js
export type SupabaseClient = any;

let supabase: SupabaseClient = {};
let supabaseAvailable = false;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase environment variables not found. Running in offline mode.");
  console.warn('⚠️ Algunas funciones dependientes de Supabase están deshabilitadas.');
} else {
  // Aunque haya variables, de momento mantenemos Supabase desactivado
  console.warn(
    "ℹ️ Supabase está configurado pero deshabilitado en esta versión (stub sin cliente real)."
  );
  supabaseAvailable = false;
}

/**
 * Exportamos los mismos nombres que antes para no romper imports:
 *   import { supabase, supabaseAvailable } from "../utils/supabaseClient";
 */
export { supabase, supabaseAvailable };
