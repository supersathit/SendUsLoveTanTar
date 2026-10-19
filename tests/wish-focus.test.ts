import { test } from 'node:test';
import assert from 'node:assert/strict';
import { focusWishAtTop, getReturnScrollTop } from '../src/lib/wishFocus';
import { WISH_FOCUS_SCROLL_MS, WISH_PRESENTATION_MS, WISH_SPOTLIGHT_TOTAL_MS } from '../src/lib/wishSpotlight';

function frameClock() {
  let callback: ((time: number) => void) | undefined;
  return {
    now: () => 0,
    request: (next: (time: number) => void) => { callback = next; return 1; },
    cancel: () => { callback = undefined; },
    step(time: number) { const next = callback; callback = undefined; next?.(time); },
  };
}

test('เลื่อนกลับจากท้ายกระดานและหน้าเว็บ ก่อนอนุญาตให้ขยายการ์ด', () => {
  const wall = { scrollTop: 6000 };
  const page = { scrollTop: 120 };
  const clock = frameClock();
  let ready = 0;
  const cancel = focusWishAtTop([wall, page], () => {
    assert.equal(wall.scrollTop, 0);
    assert.equal(page.scrollTop, 0);
    ready++;
  }, false, clock);
  clock.step(WISH_FOCUS_SCROLL_MS / 2);
  assert.equal(wall.scrollTop, 3000);
  assert.equal(page.scrollTop, 60);
  assert.equal(ready, 0);
  clock.step(WISH_FOCUS_SCROLL_MS);
  assert.equal(ready, 1);
  // การเลื่อนด้วยล้อเมาส์หรือ scroll anchoring ระหว่างขยายต้องไม่พาการ์ดหลุดจอ
  wall.scrollTop = 900; page.scrollTop = 20;
  clock.step(WISH_FOCUS_SCROLL_MS + 16);
  assert.equal(wall.scrollTop, 0);
  assert.equal(page.scrollTop, 0);
  assert.equal(ready, 1);
  cancel();
  wall.scrollTop = 500;
  clock.step(2000);
  assert.equal(wall.scrollTop, 500);
});

test('การกลับด้านบนไหลต่อเนื่อง เริ่มและหยุดนุ่มนวล ไม่วาบจากท้ายกระดาน', () => {
  const start = 6000;
  let previous = start;
  for (let elapsed = 0; elapsed <= WISH_FOCUS_SCROLL_MS; elapsed += 16) {
    const top = getReturnScrollTop(start, elapsed);
    assert.ok(top >= 0 && top <= previous);
    previous = top;
  }
  assert.ok(start - getReturnScrollTop(start, 16) < 1);
  assert.ok(getReturnScrollTop(start, WISH_FOCUS_SCROLL_MS - 16) < 1);
  assert.equal(getReturnScrollTop(start, WISH_FOCUS_SCROLL_MS / 2), start / 2);
  assert.equal(getReturnScrollTop(start, WISH_FOCUS_SCROLL_MS), 0);
  assert.equal(getReturnScrollTop(start, WISH_FOCUS_SCROLL_MS + 100), 0);
});

test('ยกเลิกเมื่อเปลี่ยนการ์ดหรือออกจากหน้าจอ โดยไม่เริ่มขยายการ์ดเก่า', () => {
  const wall = { scrollTop: 2000 };
  const clock = frameClock();
  let ready = false;
  const cancel = focusWishAtTop([wall], () => { ready = true; }, false, clock);
  clock.step(100);
  cancel();
  const stopped = wall.scrollTop;
  clock.step(1000);
  assert.equal(ready, false);
  assert.equal(wall.scrollTop, stopped);
});

test('โหมดลดการเคลื่อนไหวกลับบนสุดทันที ก่อนแสดงการ์ด', () => {
  const wall = { scrollTop: 6000 };
  const clock = frameClock();
  let ready = false;
  const cancel = focusWishAtTop([wall], () => { ready = true; }, true, clock);
  clock.step(16);
  assert.equal(wall.scrollTop, 0);
  assert.equal(ready, true);
  cancel();
});

test('คิวเผื่อเวลาเลื่อนขึ้นบนก่อนขยาย ค้าง และย่อกลับครบทั้งหมด', () => {
  assert.ok(WISH_PRESENTATION_MS >= WISH_FOCUS_SCROLL_MS + WISH_SPOTLIGHT_TOTAL_MS + 150);
});
