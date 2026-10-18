import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useLocation } from 'react-router-dom';
import { adminSupabase, publicSupabase } from '../lib/supabase';
import { formatWeddingDate, isValidWeddingDate } from '../lib/weddingDate';
import { wedding } from '../config/wedding';

type WeddingSettingsContextValue = {
  weddingDate: string | null;
  dateLabel: string;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  saveDate: (value: string) => Promise<void>;
};
const WeddingSettingsContext = createContext<WeddingSettingsContextValue | null>(null);

export function WeddingSettingsProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const live = pathname === '/display' || pathname === '/admin';
  const [weddingDate, setWeddingDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(publicSupabase));
  const [error, setError] = useState('');
  const mounted = useRef(false);
  const revision = useRef(0);

  const refresh = useCallback(async () => {
    if (!publicSupabase) return;
    const request = ++revision.current;
    try {
      const result = await publicSupabase.from('wedding_settings').select('wedding_date').eq('id', 1)
        .abortSignal(AbortSignal.timeout(15000)).single();
      if (result.error) throw result.error;
      if (!mounted.current || request !== revision.current) return;
      setWeddingDate(result.data.wedding_date); setError('');
    } catch {
      if (mounted.current && request === revision.current) setError('โหลดวันที่จัดงานไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      if (mounted.current && request === revision.current) setLoading(false);
    }
  }, []);

  const saveDate = useCallback(async (value: string) => {
    if (!isValidWeddingDate(value)) throw new Error('กรุณาเลือกวันที่จัดงานให้ถูกต้อง');
    if (!adminSupabase) throw new Error('ระบบยังไม่พร้อมบันทึกวันที่ กรุณาติดต่อผู้ดูแล');
    ++revision.current;
    try {
      // ใช้ UPDATE เท่านั้น ไม่มีสิทธิ์ INSERT/DELETE การตั้งค่าจาก frontend
      const result = await adminSupabase.from('wedding_settings').update({ wedding_date: value }).eq('id', 1)
        .select('wedding_date').abortSignal(AbortSignal.timeout(15000)).single();
      if (result.error) throw result.error;
      ++revision.current;
      if (mounted.current) { setWeddingDate(result.data.wedding_date); setError(''); setLoading(false); }
    } catch { throw new Error('บันทึกวันที่ไม่สำเร็จ กรุณาตรวจสอบสิทธิ์และลองอีกครั้ง'); }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    let channel: RealtimeChannel | null = null;
    let retryTimer: number | undefined;
    let retryCount = 0;
    void refresh();
    const visibleRefresh = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', visibleRefresh);
    window.addEventListener('online', visibleRefresh);
    document.addEventListener('visibilitychange', visibleRefresh);
    const connect = () => {
      if (!active || !publicSupabase || !live) return;
      const client = publicSupabase;
      const next = client.channel(`wedding-settings-${crypto.randomUUID()}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wedding_settings' }, () => { void refresh(); });
      channel = next;
      next.subscribe(status => {
        if (!active || channel !== next) return;
        if (status === 'SUBSCRIBED') { retryCount = 0; void refresh(); }
        else if (['CLOSED', 'CHANNEL_ERROR', 'TIMED_OUT'].includes(status) && retryTimer === undefined) {
          retryTimer = window.setTimeout(() => {
            retryTimer = undefined;
            channel = null;
            void client.removeChannel(next).then(connect).catch(connect);
          }, Math.min(15000, 1500 * 2 ** retryCount++));
        }
      });
    };
    connect();
    // หน้าแขกอ่านตอนเปิด/กลับเข้าแท็บ โดยไม่เปิด Realtime connection
    const polling = live ? window.setInterval(() => { void refresh(); }, 30000) : undefined;
    return () => {
      active = false; mounted.current = false; ++revision.current;
      clearTimeout(retryTimer); clearInterval(polling);
      const previous = channel; channel = null;
      if (previous && publicSupabase) void publicSupabase.removeChannel(previous);
      window.removeEventListener('focus', visibleRefresh);
      window.removeEventListener('online', visibleRefresh);
      document.removeEventListener('visibilitychange', visibleRefresh);
    };
  }, [live, refresh]);

  const value = useMemo(() => ({ weddingDate, dateLabel: formatWeddingDate(weddingDate) || wedding.dateFallback, loading, error, refresh, saveDate }), [weddingDate, loading, error, refresh, saveDate]);
  return <WeddingSettingsContext.Provider value={value}>{children}</WeddingSettingsContext.Provider>;
}

export function useWeddingSettings() {
  const value = useContext(WeddingSettingsContext);
  if (!value) throw new Error('ไม่พบข้อมูลการตั้งค่างาน');
  return value;
}
