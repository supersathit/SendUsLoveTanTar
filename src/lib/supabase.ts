import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
export const isSupabaseConfigured = Boolean(url && /^https?:\/\//.test(url) && key);

// หน้าแขกและจอแสดงผลเป็น anon เสมอ แม้แอดมินล็อกอินในเบราว์เซอร์เดียวกัน
export const publicSupabase = isSupabaseConfigured
  ? createClient<Database>(url!, key!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  : null;
export const adminSupabase = isSupabaseConfigured
  ? createClient<Database>(url!, key!, { auth: { storageKey: 'wedding-admin-auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })
  : null;
