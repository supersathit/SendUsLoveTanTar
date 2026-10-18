import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { adminSupabase } from '../lib/supabase';

type AuthState = { session: Session | null; isAdmin: boolean; loading: boolean; error: string };
export function useAuth() {
  const [state, setState] = useState<AuthState>({ session: null, isAdmin: false, loading: Boolean(adminSupabase), error: '' });
  useEffect(() => {
    const client = adminSupabase;
    if (!client) return;
    let active = true;
    let generation = 0;
    async function check(session: Session | null) {
      const current = ++generation;
      if (!session) { if (active) setState({ session: null, isAdmin: false, loading: false, error: '' }); return; }
      if (active) setState(previous => ({ ...previous, session, loading: true }));
      try {
        const { data, error } = await client!.rpc('is_admin');
        if (!active || current !== generation) return;
        setState({ session, isAdmin: !error && data === true, loading: false, error: error ? 'ตรวจสอบสิทธิ์ไม่สำเร็จ กรุณาลองเข้าสู่ระบบอีกครั้ง' : data ? '' : 'ไม่มีสิทธิ์เข้าถึง' });
      } catch {
        if (active && current === generation) setState({ session, isAdmin: false, loading: false, error: 'ตรวจสอบสิทธิ์ไม่สำเร็จ กรุณาลองอีกครั้ง' });
      }
    }
    // ออกจาก callback ก่อนเรียก RPC เพื่อไม่ให้รอ auth lock ของ Supabase
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => { window.setTimeout(() => { if (active) void check(session); }, 0); });
    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setState({ session: null, isAdmin: false, loading: false, error: 'อ่านการเข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง' });
      else void check(data.session);
    }).catch(() => { if (active) setState({ session: null, isAdmin: false, loading: false, error: 'อ่านการเข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง' }); });
    return () => { active = false; ++generation; listener.subscription.unsubscribe(); };
  }, []);
  const signIn = useCallback(async (email: string, password: string) => {
    if (!adminSupabase) return 'ยังไม่ได้เชื่อมต่อระบบ กรุณาตั้งค่า Supabase ก่อน';
    try {
      const { error } = await adminSupabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง';
      return '';
    } catch { return 'เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต'; }
  }, []);
  const signOut = useCallback(async () => {
    try {
      const result = await adminSupabase?.auth.signOut();
      if (result?.error) return 'ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง';
      return '';
    } catch { return 'ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง'; }
  }, []);
  return { ...state, signIn, signOut };
}
