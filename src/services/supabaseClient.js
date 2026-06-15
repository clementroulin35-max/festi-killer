import { createClient } from "@supabase/supabase-js";

// Ensure keys exist, fallback to empty string to avoid crashes during initial builds
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
