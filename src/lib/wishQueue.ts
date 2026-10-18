import type { Wish } from './types';
import { sortWishes } from './utils';
import { WISH_PRESENTATION_MS } from './wishSpotlight';

/** จัดคิวจาก snapshot ที่ผ่าน RLS แล้ว โดยไม่เชื่อข้อมูล broadcast */
export class WishQueue {
  wishes: Wish[] = [];
  private initialized = false;
  private queued = new Map<string, Wish>();
  private seen = new Set<string>();
  private nextPresentationAt = 0;

  reconcile(snapshot: Wish[]) {
    const unique = sortWishes([...new Map(snapshot.filter(w => !w.is_hidden).map(w => [w.id, w])).values()]).slice(0, 40);
    if (!this.initialized) {
      this.wishes = unique;
      unique.forEach(w => this.seen.add(w.id));
      this.initialized = true;
      return;
    }
    const byId = new Map(unique.map(w => [w.id, w]));
    this.wishes = this.wishes.flatMap(w => { const latest = byId.get(w.id); return latest ? [latest] : []; });
    this.queued = new Map([...this.queued].flatMap(([id]) => { const latest = byId.get(id); return latest ? [[id, latest] as const] : []; }));
    for (const wish of [...unique].reverse()) {
      if (this.wishes.some(w => w.id === wish.id) || this.queued.has(wish.id)) continue;
      if (this.seen.has(wish.id)) this.wishes.push(wish);
      else this.queued.set(wish.id, wish);
    }
    this.wishes = sortWishes(this.wishes).slice(0, 40);
  }

  next(): string | null {
    const next = this.queued.entries().next().value as [string, Wish] | undefined;
    if (!next) return null;
    this.queued.delete(next[0]); this.seen.add(next[0]);
    this.wishes = sortWishes([...this.wishes.filter(w => w.id !== next[0]), next[1]]).slice(0, 40);
    return next[0];
  }

  nextForPresentation(now: number): string | null {
    if (now < this.nextPresentationAt) return null;
    const id = this.next();
    if (id) this.nextPresentationAt = now + WISH_PRESENTATION_MS;
    return id;
  }

  releasePresentation() { this.nextPresentationAt = 0; }
}
