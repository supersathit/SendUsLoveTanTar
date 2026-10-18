import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { adminSupabase, publicSupabase } from '../lib/supabase';
import { WishQueue } from '../lib/wishQueue';
import { WISH_FOCUS_SCROLL_MS, WISH_PRESENTATION_MS, WISH_SPOTLIGHT_TOTAL_MS } from '../lib/wishSpotlight';
import type { ConnectionStatus, ControlEvent, Wish } from '../lib/types';

export function useWishesRealtime(mode: 'display' | 'admin', enabled = true) {
  const client = mode === 'admin' ? adminSupabase : publicSupabase;
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(Boolean(client && enabled));
  const [error, setError] = useState('');
  const [connection, setConnection] = useState<ConnectionStatus>(client ? 'connecting' : 'unconfigured');
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  const controlRef = useRef<RealtimeChannel | null>(null);
  const refresh = useCallback(() => refreshRef.current(), []);
  const broadcast = useCallback(async (event: ControlEvent, id: string) => {
    // Payload เป็นเพียงสัญญาณให้ผู้รับอ่าน DB ใหม่ ไม่เชื่อค่าจาก broadcast สาธารณะ
    try { return (await controlRef.current?.send({ type: 'broadcast', event, payload: { id } })) === 'ok'; }
    catch { return false; }
  }, []);

  useEffect(() => {
    if (!enabled || !client) { setLoading(false); setWishes([]); setTotal(0); setSpotlightId(null); return; }
    let active = true;
    let fetching = false;
    let dirty = false;
    let current: Wish[] = [];
    const queue = new WishQueue();
    const glows = new Map<string, number>();
    let spotlight: string | null = null;
    let spotlightUntil = 0;
    let insertChannel: RealtimeChannel | null = null;
    let controlChannel: RealtimeChannel | null = null;
    let retryTimer: number | undefined;
    let insertReady = false;
    let controlReady = false;
    let retryCount = 0;
    const publish = () => { if (active) setWishes([...current]); };
    function advanceQueue() {
      if (!active || mode !== 'display') return;
      const now = performance.now();
      if (spotlight) {
        if (now < spotlightUntil && current.some(wish => wish.id === spotlight)) return;
        spotlight = null; setSpotlightId(null); queue.releasePresentation();
      }
      const next = queue.nextForPresentation(now);
      if (!next) return;
      current = queue.wishes;
      spotlight = next; spotlightUntil = now + WISH_PRESENTATION_MS;
      setSpotlightId(next);
      glows.set(next, Date.now() + WISH_FOCUS_SCROLL_MS + WISH_SPOTLIGHT_TOTAL_MS);
      setFreshIds(new Set(glows.keys())); publish();
    }
    const reconcile = (snapshot: Wish[]) => {
      if (mode === 'admin') {
        current = snapshot;
        publish(); return;
      }
      queue.reconcile(snapshot); current = queue.wishes;
      publish(); advanceQueue();
    };
    const fetchSnapshot = async () => {
      if (!active) return;
      if (fetching) { dirty = true; return; }
      fetching = true;
      try {
        do {
          dirty = false;
          let snapshot: Wish[] = [];
          let count = 0;
          if (mode === 'display') {
            const result = await client.from('wishes').select('*', { count: 'exact' }).eq('is_hidden', false)
              .order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(40).abortSignal(AbortSignal.timeout(15000));
            if (result.error) throw result.error;
            snapshot = result.data; count = result.count ?? 0;
          } else {
            // ดึงทีละหน้าเพื่อไม่ให้ติดเพดาน 1,000 แถวของ Supabase
            for (let offset = 0; active; offset += 500) {
              const result = await client.from('wishes').select('*').order('created_at', { ascending: false })
                .order('id', { ascending: false }).range(offset, offset + 499).abortSignal(AbortSignal.timeout(15000));
              if (result.error) throw result.error;
              snapshot.push(...result.data);
              if (result.data.length < 500) break;
            }
            snapshot = [...new Map(snapshot.map(w => [w.id, w])).values()];
            count = snapshot.length;
          }
          if (!active) return;
          reconcile(snapshot); setTotal(count); setError('');
        } while (dirty && active);
      } catch {
        if (active) setError('โหลดคำอวยพรไม่สำเร็จ ระบบจะลองเชื่อมต่อให้อีกครั้ง');
      } finally { fetching = false; if (active) setLoading(false); }
    };
    refreshRef.current = fetchSnapshot;

    const connect = () => {
      if (!active) return;
      insertReady = false; controlReady = false; setConnection('connecting');
      const updateStatus = () => {
        if (insertReady && controlReady) { setConnection('connected'); retryCount = 0; void fetchSnapshot(); }
      };
      const retry = () => {
        if (!active) return;
        setConnection('offline');
        if (retryTimer !== undefined) return;
        retryTimer = window.setTimeout(() => {
          retryTimer = undefined;
          const previousInsert = insertChannel; const previousControl = controlChannel;
          insertChannel = null; controlChannel = null; controlRef.current = null;
          void Promise.all([previousInsert ? client.removeChannel(previousInsert) : Promise.resolve(), previousControl ? client.removeChannel(previousControl) : Promise.resolve()])
            .then(() => { if (active) connect(); }).catch(() => { if (active) connect(); });
        }, Math.min(15000, 1500 * 2 ** retryCount++));
      };
      const nextInsert = client.channel(`wishes-${mode}-${crypto.randomUUID()}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wishes' }, () => { void fetchSnapshot(); });
      if (mode === 'admin') {
        nextInsert.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'wishes' }, () => { void fetchSnapshot(); })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'wishes' }, () => { void fetchSnapshot(); });
      }
      insertChannel = nextInsert;
      nextInsert.subscribe(status => {
        if (!active || insertChannel !== nextInsert) return;
        insertReady = status === 'SUBSCRIBED';
        if (insertReady) updateStatus();
        else if (['CLOSED', 'CHANNEL_ERROR', 'TIMED_OUT'].includes(status)) retry();
      });
      const nextControl = client.channel('wishes-control', { config: { broadcast: { self: true, ack: true } } });
      for (const event of ['hide', 'unhide', 'pin', 'delete']) {
        nextControl.on('broadcast', { event }, () => { void fetchSnapshot(); });
      }
      controlChannel = nextControl; controlRef.current = nextControl;
      nextControl.subscribe(status => {
        if (!active || controlChannel !== nextControl) return;
        controlReady = status === 'SUBSCRIBED';
        if (controlReady) updateStatus();
        else if (['CLOSED', 'CHANNEL_ERROR', 'TIMED_OUT'].includes(status)) retry();
      });
    };
    setLoading(true); setError(''); setFreshIds(new Set()); setSpotlightId(null);
    connect(); void fetchSnapshot();
    const polling = window.setInterval(() => { void fetchSnapshot(); }, 30000);
    const queueTimer = window.setInterval(advanceQueue, 100);
    const glowTimer = window.setInterval(() => {
      let changed = false;
      for (const [id, expires] of glows) if (Date.now() >= expires) { glows.delete(id); changed = true; }
      if (active && changed) setFreshIds(new Set(glows.keys()));
    }, 400);
    const onVisible = () => { if (document.visibilityState === 'visible') void fetchSnapshot(); };
    window.addEventListener('online', fetchSnapshot);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      clearInterval(polling); clearInterval(queueTimer); clearInterval(glowTimer); clearTimeout(retryTimer);
      const previousInsert = insertChannel; const previousControl = controlChannel;
      insertChannel = null; controlChannel = null; controlRef.current = null;
      if (previousInsert) void client.removeChannel(previousInsert);
      if (previousControl) void client.removeChannel(previousControl);
      window.removeEventListener('online', fetchSnapshot); document.removeEventListener('visibilitychange', onVisible);
      refreshRef.current = async () => {};
    };
  }, [client, enabled, mode]);
  return { wishes, total, loading, error, connection, freshIds, spotlightId, refresh, broadcast };
}
