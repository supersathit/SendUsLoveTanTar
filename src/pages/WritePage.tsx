import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { wedding } from '../config/wedding';
import { Divider, FloralCorner, WeddingLogo } from '../components/Decorations';
import { WishForm } from '../components/WishForm';
import { Icon } from '../components/Icon';
import { FloatingHearts } from '../components/FloatingHearts';
import { useWeddingSettings } from '../hooks/useWeddingSettings';

export function WritePage() {
  const [sent, setSent] = useState(false);
  const { dateLabel } = useWeddingSettings();
  return <main className="write-page">
    <FloatingHearts />
    <div className="write-shell">
      <FloralCorner className="write-floral-left" /><FloralCorner className="write-floral-right" />
      <header className="write-header"><div className="eyebrow">ร่วมเป็นส่วนหนึ่งในวันสำคัญของเรา</div><WeddingLogo /><h1 className="couple-title">{wedding.title}</h1><Divider /><p className="wedding-date">{dateLabel}</p></header>
      <AnimatePresence mode="wait" initial={false}>{sent ? <motion.section key="thanks" className="thanks-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} aria-live="polite">
        <div className="thanks-heart" aria-hidden="true"><Icon name="heart" size={64} />{Array.from({ length: 7 }, (_, i) => <motion.span key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: [0, 1, 0], y: -100 - i * 12, x: (i - 3) * 30 }} transition={{ duration: 3, delay: i * 0.15 }}>♥</motion.span>)}</div>
        <h2>ขอบคุณจากหัวใจ</h2><p>คำอวยพรของคุณส่งถึงเราแล้ว<br />และจะปรากฏบนจอในงานค่ะ</p><button className="button-primary" onClick={() => setSent(false)}>เขียนคำอวยพรอีกครั้ง<Icon name="arrow" size={18} /></button>
      </motion.section> : <motion.section key="form" className="form-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><div className="form-intro"><span className="small-heart" aria-hidden="true">♡</span><h2>ฝากคำอวยพรให้เราสองคน</h2><p>{wedding.invitation}</p></div><WishForm onSuccess={() => { setSent(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} /></motion.section>}</AnimatePresence>
      <footer className="write-footer"><span aria-hidden="true">✧</span> ด้วยรักและขอบคุณจากบ่าวสาว <span aria-hidden="true">✧</span><p>{wedding.bride} และ {wedding.groom}</p></footer>
    </div>
  </main>;
}
