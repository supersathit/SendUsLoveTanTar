import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WishQueue } from '../src/lib/wishQueue';
import { csvCell, relativeTime, wishesCsv } from '../src/lib/utils';
import type { Wish } from '../src/lib/types';

function wish(n: number, changes: Partial<Wish> = {}): Wish {
  return { id: `wish-${n}`, created_at: new Date(Date.UTC(2026, 9, 24, 0, n)).toISOString(), guest_name: 'แขกทดสอบ', side: 'both', message: 'ยินดีด้วยนะคะ', image_file_id: null, is_hidden: false, is_pinned: false, ...changes };
}
test('snapshot แรกไม่เล่นเอฟเฟกต์ และข้อความพร้อมกันเข้าคิวทีละใบโดยไม่ซ้ำ', () => {
  const queue = new WishQueue();
  queue.reconcile([wish(1)]);
  assert.equal(queue.next(), null);
  queue.reconcile([wish(3), wish(2), wish(1), wish(2)]);
  assert.deepEqual(queue.wishes.map(w => w.id), ['wish-1']);
  assert.equal(queue.next(), 'wish-2');
  queue.reconcile([wish(3), wish(2), wish(1)]);
  assert.equal(queue.next(), 'wish-3');
  assert.equal(queue.next(), null);
  assert.deepEqual(queue.wishes.map(w => w.id), ['wish-3', 'wish-2', 'wish-1']);
});
test('ซ่อนหรือลบข้อความที่ยังรอคิวแล้วไม่หลุดขึ้นจอ และถอนข้อความเดิมทันที', () => {
  const queue = new WishQueue();
  queue.reconcile([wish(1), wish(2)]);
  queue.reconcile([wish(1), wish(2), wish(3)]);
  queue.reconcile([wish(2), wish(3, { is_hidden: true })]);
  assert.deepEqual(queue.wishes.map(w => w.id), ['wish-2']);
  assert.equal(queue.next(), null);
});
test('ปักหมุดอยู่บนสุด เลิกปักหมุดกลับไปเรียงเวลา และ unhide ไม่เพิ่มการ์ดซ้ำ', () => {
  const queue = new WishQueue();
  queue.reconcile([wish(3), wish(2), wish(1, { is_pinned: true })]);
  assert.equal(queue.wishes[0].id, 'wish-1');
  queue.reconcile([wish(3), wish(2), wish(1)]);
  assert.equal(queue.wishes[0].id, 'wish-3');
  queue.reconcile([wish(3), wish(2)]);
  queue.reconcile([wish(3), wish(2), wish(1)]);
  assert.equal(queue.wishes.length, 3);
  assert.equal(queue.next(), null);
});
test('reconcile หลังเน็ตหลุดรักษาข้อความล่าสุด 40 ใบรวมการ์ดปักหมุด', () => {
  const queue = new WishQueue();
  queue.reconcile([wish(0, { is_pinned: true })]);
  const snapshot = [wish(0, { is_pinned: true }), ...Array.from({ length: 55 }, (_, i) => wish(i + 1))];
  queue.reconcile(snapshot);
  let arrivals = 0;
  while (queue.next()) arrivals++;
  assert.equal(arrivals, 39);
  assert.equal(queue.wishes.length, 40);
  assert.equal(queue.wishes[0].id, 'wish-0');
  assert.equal(queue.wishes[1].id, 'wish-55');
  assert.equal(queue.wishes.at(-1)?.id, 'wish-17');
});
test('คิวใช้ข้อมูลปักหมุดล่าสุดแม้การ์ดยังไม่แสดง', () => {
  const queue = new WishQueue();
  queue.reconcile([wish(1)]);
  queue.reconcile([wish(1), wish(2)]);
  queue.reconcile([wish(1), wish(2, { is_pinned: true })]);
  assert.equal(queue.next(), 'wish-2');
  assert.equal(queue.wishes[0].is_pinned, true);
});
test('CSV มี BOM, escape ข้อความหลายบรรทัด และป้องกัน Excel formula injection', () => {
  const csv = wishesCsv([wish(1, { guest_name: '=HYPERLINK("bad")', message: 'ขอให้มีความสุข,\n"รักกัน"', image_file_id: 'test-file' })]);
  assert.ok(csv.startsWith('\uFEFF"เวลา"'));
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.includes('"ขอให้มีความสุข,\n""รักกัน"""'));
  assert.ok(csv.includes('https://drive.google.com/file/d/test-file/view'));
  assert.equal(csvCell('  +1'), '"\'  +1"');
});
test('เวลาสัมพัทธ์ถูกต้องที่ขอบเขตนาที ชั่วโมง และข้อความจากนาฬิกาที่เร็วกว่า', () => {
  const now = Date.UTC(2026, 9, 24, 10);
  assert.equal(relativeTime(new Date(now - 59999).toISOString(), now), 'เมื่อสักครู่');
  assert.equal(relativeTime(new Date(now - 60000).toISOString(), now), '1 นาทีที่แล้ว');
  assert.equal(relativeTime(new Date(now - 3600000).toISOString(), now), '1 ชั่วโมงที่แล้ว');
  assert.equal(relativeTime(new Date(now + 60000).toISOString(), now), 'เมื่อสักครู่');
});
