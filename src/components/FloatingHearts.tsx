import { memo, type CSSProperties } from 'react';
import { Icon } from './Icon';

// ค่าคงที่และ delay ติดลบทำให้มีหัวใจกระจายอยู่แล้วเมื่อเปิดหน้า
// ไม่สุ่มใหม่เมื่อมีคำอวยพรเข้ามาหรือพิมพ์ฟอร์ม
const hearts = [
  { left: 5, size: 36, duration: 28, delay: -8, drift: 35 },
  { left: 18, size: 58, duration: 36, delay: -23, drift: -28 },
  { left: 31, size: 24, duration: 25, delay: -15, drift: 24 },
  { left: 44, size: 44, duration: 32, delay: -4, drift: -38 },
  { left: 57, size: 30, duration: 27, delay: -20, drift: 30 },
  { left: 70, size: 64, duration: 38, delay: -12, drift: -32 },
  { left: 83, size: 40, duration: 31, delay: -26, drift: 28 },
  { left: 95, size: 26, duration: 26, delay: -6, drift: -24 },
  { left: 11, size: 22, duration: 24, delay: -19, drift: 42 },
  { left: 25, size: 42, duration: 34, delay: -10, drift: -35 },
  { left: 51, size: 56, duration: 37, delay: -30, drift: 25 },
  { left: 65, size: 20, duration: 25, delay: -3, drift: -30 },
  { left: 77, size: 32, duration: 29, delay: -17, drift: 36 },
  { left: 90, size: 50, duration: 35, delay: -28, drift: -40 },
];

export const FloatingHearts = memo(function FloatingHearts() {
  return <div className="floating-hearts" aria-hidden="true">
    {hearts.map((heart, index) => <span key={heart.left} className="floating-heart" style={{
      left: `${heart.left}%`,
      width: heart.size,
      height: heart.size,
      '--heart-duration': `${heart.duration}s`,
      '--heart-delay': `${heart.delay}s`,
      '--heart-drift': `${heart.drift}px`,
      '--heart-opacity': index % 3 === 0 ? 0.16 : 0.11,
      '--heart-rest-top': `${12 + (index * 19) % 74}%`,
    } as CSSProperties}><Icon name="heart" size={heart.size} /></span>)}
  </div>;
});
