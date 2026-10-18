import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { writeUrl } from '../lib/utils';

export function useQRColors() {
  const [colors, setColors] = useState({ fg: '', bg: '' });
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    setColors({ fg: styles.getPropertyValue('--color-text').trim(), bg: styles.getPropertyValue('--color-surface').trim() });
  }, []);
  return colors;
}
export function QRBadge() {
  const { fg, bg } = useQRColors();
  return <aside className="qr-badge">{fg && <QRCodeSVG value={writeUrl()} size={138} level="M" marginSize={2} fgColor={fg} bgColor={bg} />}<strong>สแกนเพื่อร่วมอวยพร</strong><span>ส่งความรักถึงบ่าวสาว</span></aside>;
}
