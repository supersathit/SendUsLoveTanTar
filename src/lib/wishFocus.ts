import { WISH_FOCUS_SCROLL_MS } from './wishSpotlight';

type ScrollTarget = { scrollTop: number };
type FrameClock = {
  now: () => number;
  request: (callback: (time: number) => void) => number;
  cancel: (id: number) => void;
};

/** เลื่อนทั้งกระดานและหน้าเว็บถึงด้านบนก่อนเริ่มขยาย และตรึงไว้จนจบการนำเสนอ */
export function focusWishAtTop(
  targets: ScrollTarget[],
  onReady: () => void,
  reducedMotion = false,
  clock: FrameClock = {
    now: () => performance.now(),
    request: callback => requestAnimationFrame(callback),
    cancel: id => cancelAnimationFrame(id),
  },
) {
  const starts = targets.map(target => target.scrollTop);
  const started = clock.now();
  let frame = 0;
  let ready = false;
  let cancelled = false;
  const tick = (time: number) => {
    if (cancelled) return;
    const progress = reducedMotion ? 1 : Math.min(1, Math.max(0, (time - started) / WISH_FOCUS_SCROLL_MS));
    targets.forEach((target, index) => { target.scrollTop = starts[index] * (1 - progress) ** 3; });
    if (progress === 1 && !ready) { ready = true; onReady(); }
    if (!cancelled) frame = clock.request(tick);
  };
  frame = clock.request(tick);
  return () => { cancelled = true; clock.cancel(frame); };
}
