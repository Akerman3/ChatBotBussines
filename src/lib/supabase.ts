import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zjwquaevoudvrisyyrts.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_s9xESUfeZLauJjOa3m6A7A_OG1uEubQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
