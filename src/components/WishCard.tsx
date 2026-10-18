import { motion, useReducedMotion } from 'framer-motion';
import { useLayoutEffect, useRef, useState } from 'react';
import type { Wish } from '../lib/types';
import { sideLabels } from '../lib/types';
import { relativeTime } from '../lib/utils';
import { DriveImage } from './DriveImage';
import { Icon } from './Icon';
import { WishCardSpotlight } from './WishCardSpotlight';

export function WishCard({ wish, fresh, now, spotlight = false, spotlightReady = spotlight }: { wish: Wish; fresh: boolean; now: number; spotlight?: boolean; spotlightReady?: boolean }) {
  const reduced = useReducedMotion();
  const card = useRef<HTMLElement>(null);
  const [finished, setFinished] = useState(false);
  useLayoutEffect(() => {
    if (!spotlight) setFinished(false);
  }, [spotlight]);
  const presenting = spotlight && !finished && !reduced;
  const content = <WishCardContent wish={wish} now={now} fresh={fresh} reduced={Boolean(reduced)} />;
  return <><motion.article ref={card} layout initial={fresh && !spotlight && !reduced ? { opacity: 0, scale: 0.6, filter: 'blur(8px)' } : false}
    animate={{ opacity: 1, scale: 1, x: 0, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 0.85 }}
    style={{ visibility: presenting ? 'hidden' : 'visible' }} aria-hidden={presenting || undefined}
    whileHover={reduced || spotlight ? undefined : { y: -6, scale: 1.015 }}
    transition={{ type: 'spring', stiffness: 180, damping: 20, layout: { duration: 0.65 } }}
    className={`wish-card ${fresh && !spotlight ? 'wish-fresh' : ''} ${spotlight ? 'wish-spotlight' : ''} ${wish.is_pinned ? 'wish-pinned' : ''}`}>
    {content}
  </motion.article>
    {presenting && spotlightReady && <WishCardSpotlight anchor={card} onComplete={() => setFinished(true)}>{content}</WishCardSpotlight>}
  </>;
}

function WishCardContent({ wish, now, fresh, reduced }: { wish: Wish; now: number; fresh: boolean; reduced: boolean }) {
  return <>
    {wish.is_pinned && <span className="pin-badge"><Icon name="pin" size={14} />ปักหมุด</span>}
    {wish.image_file_id && <DriveImage fileId={wish.image_file_id} alt={`รูปจาก ${wish.guest_name}`} className="wish-photo" />}
    <span className="quote-mark" aria-hidden="true">“</span>
    <p className="wish-message">{wish.message}</p>
    <span className="quote-mark quote-mark-close" aria-hidden="true">”</span>
    <div className="wish-card-footer"><div className="wish-author"><span className="avatar" aria-hidden="true">{Array.from(wish.guest_name)[0]}</span><div><strong>{wish.guest_name}</strong><time dateTime={wish.created_at}>{relativeTime(wish.created_at, now)}</time></div></div>
      {wish.side && <span className={`side-badge ${wish.side}`}>{sideLabels[wish.side]}</span>}
    </div>
    {fresh && !reduced && <div className="card-sparks" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <motion.span key={i} initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }} animate={{ opacity: [0, 1, 0], x: Math.cos(i * Math.PI / 4) * 160, y: Math.sin(i * Math.PI / 4) * 140, scale: [0.5, 1, 0.3] }} transition={{ duration: 1.8, delay: i * 0.04 }}>{i % 2 ? '✧' : '♥'}</motion.span>)}</div>}
  </>;
}
