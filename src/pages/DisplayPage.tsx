import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, useReducedMotion } from 'framer-motion';
import { wedding } from '../config/wedding';
import { useWishesRealtime } from '../hooks/useWishesRealtime';
import { Divider, FloralCorner, WeddingLogo } from '../components/Decorations';
import { WishCard } from '../components/WishCard';
import { QRBadge } from '../components/QRBadge';
import { ConnectionDot } from '../components/ConnectionDot';
import { Icon } from '../components/Icon';
import { FloatingHearts } from '../components/FloatingHearts';
import { useWeddingSettings } from '../hooks/useWeddingSettings';
import { getSpotlightWishes, WISH_FOCUS_SCROLL_MS } from '../lib/wishSpotlight';
import { useWishFocus } from '../hooks/useWishFocus';
import { getReturnScrollTop } from '../lib/wishFocus';

export function DisplayPage() {
  const data = useWishesRealtime('display');
  const { dateLabel } = useWeddingSettings();
  const scroller = useRef<HTMLDivElement>(null);
  const focusedId = useWishFocus(scroller, data.spotlightId);
  const reducedMotion = useReducedMotion();
  const [activeMouse, setActiveMouse] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [screenError, setScreenError] = useState('');
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    let idleTimer = window.setTimeout(() => setActiveMouse(false), 3000);
    const activate = () => { setActiveMouse(true); clearTimeout(idleTimer); idleTimer = window.setTimeout(() => setActiveMouse(false), 3000); };
    window.addEventListener('mousemove', activate); window.addEventListener('touchstart', activate); window.addEventListener('keydown', activate);
    return () => { clearInterval(timer); clearTimeout(idleTimer); window.removeEventListener('mousemove', activate); window.removeEventListener('touchstart', activate); window.removeEventListener('keydown', activate); };
  }, []);
  useEffect(() => {
    let animation = 0;
    let previous = performance.now();
    let position = 0;
    let pauseUntil = previous + 4000;
    let returning: { started: number; from: number } | null = null;
    const tick = (time: number) => {
      const elapsed = Math.min(time - previous, 100); previous = time;
      const element = scroller.current;
      if (element && !activeMouse && !data.spotlightId && time > pauseUntil && returning) {
        const elapsedReturn = time - returning.started;
        position = reducedMotion ? 0 : getReturnScrollTop(returning.from, elapsedReturn);
        element.scrollTop = position;
        if (reducedMotion || elapsedReturn >= WISH_FOCUS_SCROLL_MS) {
          returning = null; position = 0; pauseUntil = time + 4000;
        }
      } else if (element && !activeMouse && !data.spotlightId && time > pauseUntil) {
        const max = element.scrollHeight - element.clientHeight;
        if (max > 0) {
          position = Math.max(position, element.scrollTop) + elapsed * 0.022;
          element.scrollTop = position;
          if (position >= max) {
            position = max; element.scrollTop = max;
            returning = { started: time, from: max };
          }
        }
      } else if (element) position = element.scrollTop;
      animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animation);
  }, [activeMouse, data.spotlightId, reducedMotion]);
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let disposed = false;
    const acquire = async () => {
      if (!('wakeLock' in navigator) || document.visibilityState !== 'visible' || lock) return;
      try {
        const next = await navigator.wakeLock.request('screen');
        if (disposed) { await next.release(); return; }
        lock = next; next.addEventListener('release', () => { if (lock === next) lock = null; });
      } catch { /* เบราว์เซอร์อาจปฏิเสธเมื่อแบตเตอรี่ต่ำ: ไม่ขัดการแสดงผล */ }
    };
    void acquire(); document.addEventListener('visibilitychange', acquire);
    return () => { disposed = true; document.removeEventListener('visibilitychange', acquire); void lock?.release().catch(() => {}); };
  }, []);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { setScreenError('เบราว์เซอร์นี้ไม่รองรับเต็มจอ กรุณาใช้โหมดเต็มจอของเบราว์เซอร์'); }
  }
  // ระหว่างแสดงคำอวยพรใหม่ ให้ใบนั้นอยู่ใบแรกเสมอ ก่อนคืนลำดับปักหมุดตามเดิม
  const displayedWishes = getSpotlightWishes(data.wishes, data.spotlightId);
  return <MotionConfig reducedMotion="user"><main className={`display-page ${activeMouse ? '' : 'mouse-idle'}`}>
    <FloatingHearts />
    <FloralCorner className="display-floral-left" /><FloralCorner className="display-floral-right" />
    <header className="display-header"><WeddingLogo /><div className="display-heading"><p className="eyebrow">คำอวยพรและความทรงจำในวันของเรา</p><h1 className="couple-title">{wedding.title}</h1><Divider /><p className="wedding-date">{dateLabel}</p></div><QRBadge /></header>
    <div ref={scroller} className="wall-scroll"><div className="wishes-wall"><AnimatePresence initial={false}>{displayedWishes.map(wish => <WishCard key={wish.id} wish={wish} fresh={wish.id === focusedId && data.freshIds.has(wish.id)} spotlight={wish.id === data.spotlightId} spotlightReady={wish.id === focusedId} now={now} />)}</AnimatePresence></div>
      {!data.wishes.length && <div className="wall-empty"><Icon name="heart" size={46} /><h2>{data.loading ? 'กำลังรวบรวมความรัก...' : 'คำอวยพรแรกของเรา อาจเป็นของคุณ'}</h2><p>{data.connection === 'unconfigured' ? 'กรุณาเชื่อมต่อระบบก่อนเปิดรับคำอวยพร' : 'สแกนคิวอาร์โค้ด แล้วฝากความรู้สึกดี ๆ ถึงบ่าวสาว'}</p></div>}
    </div>
    <div className="display-bottom"><ConnectionDot status={data.connection} /><p role="status">{data.error || screenError || 'ทุกคำอวยพร จะอยู่ในความทรงจำของเราเสมอ'}</p><span className="wish-count">คำอวยพรทั้งหมด <b>{data.total.toLocaleString('th-TH')}</b> ข้อความ</span></div>
    <button className={`fullscreen-button ${activeMouse ? '' : 'control-idle'}`} onClick={() => { void toggleFullscreen(); }} aria-label="เปิดหรือออกจากโหมดเต็มจอ" title="เต็มจอ"><Icon name="expand" /></button>
  </main></MotionConfig>;
}
