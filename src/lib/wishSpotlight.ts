import type { Wish } from './types';

export const WISH_SPOTLIGHT_SCALE = 2;
export const WISH_FOCUS_SCROLL_MS = 650;
export const WISH_SPOTLIGHT_ENTER_MS = 350;
export const WISH_SPOTLIGHT_HOLD_MS = 3000;
export const WISH_SPOTLIGHT_RETURN_MS = 650;
export const WISH_SPOTLIGHT_TOTAL_MS = WISH_SPOTLIGHT_ENTER_MS + WISH_SPOTLIGHT_HOLD_MS + WISH_SPOTLIGHT_RETURN_MS;
export const WISH_PRESENTATION_MS = WISH_FOCUS_SCROLL_MS + WISH_SPOTLIGHT_TOTAL_MS + 150;

export function getWishSpotlightScale(width: number, height: number, availableWidth: number, availableHeight: number) {
  if (width <= 0 || height <= 0) return 1;
  return Math.max(1, Math.min(WISH_SPOTLIGHT_SCALE, availableWidth / width, availableHeight / height));
}

export function getWishSpotlightPlacement(width: number, height: number, left: number, top: number, viewportWidth: number, viewportHeight: number) {
  const scale = width > 0 && height > 0
    ? Math.max(0.01, Math.min(WISH_SPOTLIGHT_SCALE, Math.max(1, viewportWidth - 48) / width, Math.max(1, viewportHeight - 48) / height))
    : 1;
  const centered = (value: number) => ({ x: (viewportWidth - width * value) / 2 - left, y: (viewportHeight - height * value) / 2 - top });
  return { scale, start: centered(Math.min(0.6, scale)), center: centered(scale) };
}

export function getSpotlightWishes(wishes: Wish[], spotlightId: string | null) {
  const featured = wishes.find(wish => wish.id === spotlightId);
  return featured ? [featured, ...wishes.filter(wish => wish.id !== featured.id)] : wishes;
}
