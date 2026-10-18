import { driveLink } from './drive';
import { sideLabels, type Wish } from './types';

export function writeUrl() {
  const url = new URL(window.location.href);
  url.hash = '/write';
  url.search = '';
  return url.href;
}
export function relativeTime(value: string, now = Date.now()) {
  const seconds = Math.max(0, Math.floor((now - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'เมื่อสักครู่';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(seconds / 86400)} วันที่แล้ว`;
}
export function sortWishes(wishes: Wish[]) {
  return [...wishes].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
}
export function csvCell(value: string) {
  // ป้องกันสูตรที่อาจถูกประมวลผลเมื่อเปิด CSV ใน Excel
  const safe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function wishesCsv(wishes: Wish[]) {
  const rows = [['เวลา', 'ชื่อ', 'ฝ่าย', 'ข้อความ', 'ลิงก์รูป', 'สถานะ'], ...wishes.map(w => [
    new Date(w.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }), w.guest_name,
    w.side ? sideLabels[w.side] : 'ไม่ระบุ', w.message, w.image_file_id ? driveLink(w.image_file_id) : '',
    `${w.is_hidden ? 'ซ่อนอยู่' : 'แสดงอยู่'}${w.is_pinned ? ' / ปักหมุด' : ''}`,
  ])];
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
