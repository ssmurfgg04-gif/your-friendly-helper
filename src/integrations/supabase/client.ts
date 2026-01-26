import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://wmeijbrqjuhvnksiijcz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZWlqYnJxanVodm5rc2lpamN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzM5ODksImV4cCI6MjA4NDgwOTk4OX0.4PMYHuvJUjd8vQ-P55U1IKyEPYEtBuJFSEp8uD-T078";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});
