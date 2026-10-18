import { useCallback, useEffect, useState } from 'react';

const KEY = 'wedding-last-wish';
export const COOLDOWN_MS = 30_000;
let memoryTimestamp = 0;
function lastSent() {
  try { return Math.max(memoryTimestamp, Number(localStorage.getItem(KEY)) || 0); }
  catch { return memoryTimestamp; }
}
export function remainingCooldown(last: number, now = Date.now()) {
  return Math.max(0, Math.min(30, Math.ceil((last + COOLDOWN_MS - now) / 1000)));
}
export function useCooldown() {
  const [remaining, setRemaining] = useState(() => remainingCooldown(lastSent()));
  useEffect(() => {
    const update = () => setRemaining(remainingCooldown(lastSent()));
    const timer = window.setInterval(update, 500);
    window.addEventListener('storage', update);
    return () => { clearInterval(timer); window.removeEventListener('storage', update); };
  }, []);
  const start = useCallback(() => {
    memoryTimestamp = Date.now();
    try { localStorage.setItem(KEY, String(memoryTimestamp)); } catch { /* ใช้ memory เมื่อ storage ถูกปิด */ }
    setRemaining(30);
  }, []);
  const canSend = useCallback(() => remainingCooldown(lastSent()) === 0, []);
  return { remaining, start, canSend };
}
