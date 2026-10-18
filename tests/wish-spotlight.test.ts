import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WishQueue } from '../src/lib/wishQueue';
import { getSpotlightWishes, getWishSpotlightPlacement, getWishSpotlightScale, WISH_PRESENTATION_MS, WISH_SPOTLIGHT_HOLD_MS } from '../src/lib/wishSpotlight';
import type { Wish } from '../src/lib/types';

function wish(n: number, pinned = false): Wish {
  return { id: `wish-${n}`, created_at: new Date(Date.UTC(2026, 9, 24, 0, n)).toISOString(), guest_name: 'แขกทดสอบ', side: 'both', message: 'ขอให้มีความสุข', image_file_id: null, is_hidden: false, is_pinned: pinned };
}

test('คำอวยพรที่เข้ามาพร้อมกันรอให้ขยาย ค้าง 3 วินาที และย่อกลับก่อนเริ่มใบถัดไป', () => {
  const queue = new WishQueue();
  queue.reconcile([wish(1)]);
  queue.reconcile([wish(3), wish(2), wish(1)]);
  assert.equal(queue.nextForPresentation(0), 'wish-2');
  assert.equal(WISH_SPOTLIGHT_HOLD_MS, 3000);
  for (const time of [100, 1200, 3000, 3550, 4199, WISH_PRESENTATION_MS - 1]) assert.equal(queue.nextForPresentation(time), null);
  assert.equal(queue.wishes.length, 2);
  assert.equal(queue.nextForPresentation(WISH_PRESENTATION_MS), 'wish-3');
  assert.equal(queue.wishes.length, 3);
  assert.equal(queue.nextForPresentation(WISH_PRESENTATION_MS * 2), null);
});

test('เมื่อซ่อนการ์ดที่กำลังขยาย สามารถยกเลิกแล้วแสดงใบถัดไปได้โดยไม่แสดงการ์ดที่ลบไป', () => {
  const queue = new WishQueue();
  queue.reconcile([wish(1)]);
  queue.reconcile([wish(3), wish(2), wish(1)]);
  assert.equal(queue.nextForPresentation(0), 'wish-2');
  queue.reconcile([wish(3), wish(1)]);
  queue.releasePresentation();
  assert.equal(queue.nextForPresentation(500), 'wish-3');
  assert.equal(queue.wishes.some(w => w.id === 'wish-2'), false);
});

test('การ์ดที่กำลังโฟกัสเป็นใบแรกแม้มีปักหมุด แล้วคืนลำดับเดิมเมื่อจบ โดยไม่มีการ์ดซ้ำ', () => {
  const wishes = [wish(1, true), wish(3), wish(2)];
  assert.deepEqual(getSpotlightWishes(wishes, 'wish-3').map(w => w.id), ['wish-3', 'wish-1', 'wish-2']);
  assert.deepEqual(getSpotlightWishes(wishes, null).map(w => w.id), ['wish-1', 'wish-3', 'wish-2']);
  assert.deepEqual(getSpotlightWishes(wishes, 'deleted').map(w => w.id), ['wish-1', 'wish-3', 'wish-2']);
  assert.equal(new Set(getSpotlightWishes(wishes, 'wish-3').map(w => w.id)).size, 3);
});

test('ขยาย 2 เท่าเมื่อมีพื้นที่พอ และปรับให้พอดีสำหรับการ์ดยาวหรือหน้าจอแคบ', () => {
  assert.equal(getWishSpotlightScale(400, 250, 1800, 700), 2);
  assert.equal(getWishSpotlightScale(400, 500, 1800, 700), 1.4);
  assert.equal(getWishSpotlightScale(350, 250, 350, 700), 1);
  assert.equal(getWishSpotlightScale(400, 900, 1800, 700), 1);
  assert.equal(getWishSpotlightScale(0, 0, 1800, 700), 1);
});

test('การ์ดใหม่เริ่มและค้างตรงกึ่งกลางหน้าจอ แม้ตำแหน่งในกระดานอยู่มุมซ้าย', () => {
  const placement = getWishSpotlightPlacement(400, 250, 44, 230, 1920, 1080);
  assert.equal(placement.scale, 2);
  assert.equal(44 + placement.start.x + 400 * 0.6 / 2, 960);
  assert.equal(230 + placement.start.y + 250 * 0.6 / 2, 540);
  assert.equal(44 + placement.center.x + 400 * placement.scale / 2, 960);
  assert.equal(230 + placement.center.y + 250 * placement.scale / 2, 540);
});

test('การ์ดกลางจอมีขอบว่างและไม่ล้นหน้าจอเล็ก รวมถึงข้อความยาว', () => {
  for (const [width, height, screenWidth, screenHeight] of [[350, 250, 390, 700], [400, 900, 1024, 600], [280, 350, 390, 700]]) {
    const placement = getWishSpotlightPlacement(width, height, 20, 250, screenWidth, screenHeight);
    const left = 20 + placement.center.x;
    const top = 250 + placement.center.y;
    assert.ok(left >= 24 && top >= 24);
    assert.ok(left + width * placement.scale <= screenWidth - 24);
    assert.ok(top + height * placement.scale <= screenHeight - 24);
  }
});
