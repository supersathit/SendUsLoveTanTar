import { useLayoutEffect, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { getWishSpotlightPlacement, WISH_SPOTLIGHT_ENTER_MS, WISH_SPOTLIGHT_HOLD_MS, WISH_SPOTLIGHT_TOTAL_MS } from '../lib/wishSpotlight';

export function WishCardSpotlight({ anchor, children, onComplete }: { anchor: RefObject<HTMLElement>; children: ReactNode; onComplete: () => void }) {
  const [bounds, setBounds] = useState<{ width: number; height: number; left: number; top: number; viewportWidth: number; viewportHeight: number } | null>(null);
  useLayoutEffect(() => {
    const element = anchor.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      setBounds({ width: element.offsetWidth, height: element.offsetHeight, left: rect.left, top: rect.top, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [anchor]);
  if (!bounds) return null;
  const placement = getWishSpotlightPlacement(bounds.width, bounds.height, bounds.left, bounds.top, bounds.viewportWidth, bounds.viewportHeight);
  const transition = {
    duration: WISH_SPOTLIGHT_TOTAL_MS / 1000,
    times: [0, WISH_SPOTLIGHT_ENTER_MS / WISH_SPOTLIGHT_TOTAL_MS, (WISH_SPOTLIGHT_ENTER_MS + WISH_SPOTLIGHT_HOLD_MS) / WISH_SPOTLIGHT_TOTAL_MS, 1],
    ease: 'easeInOut' as const,
  };
  return createPortal(<div className="wish-spotlight-layer">
    <motion.article className="wish-card wish-spotlight wish-fresh" style={{ position: 'absolute', width: bounds.width, left: bounds.left, top: bounds.top }}
      initial={{ opacity: 0, scale: Math.min(0.6, placement.scale), x: placement.start.x, y: placement.start.y, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: [Math.min(0.6, placement.scale), placement.scale, placement.scale, 1], x: [placement.start.x, placement.center.x, placement.center.x, 0], y: [placement.start.y, placement.center.y, placement.center.y, 0], filter: 'blur(0px)' }}
      transition={{ scale: transition, x: transition, y: transition, opacity: { duration: WISH_SPOTLIGHT_ENTER_MS / 1000 }, filter: { duration: WISH_SPOTLIGHT_ENTER_MS / 1000 } }}
      onAnimationComplete={onComplete}>
      {children}
    </motion.article>
  </div>, document.body);
}
