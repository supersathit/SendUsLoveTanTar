import { useLayoutEffect, useState, type RefObject } from 'react';
import { useReducedMotion } from 'framer-motion';
import { focusWishAtTop } from '../lib/wishFocus';

export function useWishFocus(scroller: RefObject<HTMLDivElement>, spotlightId: string | null) {
  const [readyId, setReadyId] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  useLayoutEffect(() => {
    setReadyId(null);
    if (!spotlightId || !scroller.current) return;
    const targets: HTMLElement[] = [scroller.current];
    if (document.scrollingElement instanceof HTMLElement) targets.push(document.scrollingElement);
    return focusWishAtTop(targets, () => setReadyId(spotlightId), Boolean(reducedMotion));
  }, [scroller, spotlightId, reducedMotion]);
  return readyId === spotlightId ? readyId : null;
}
