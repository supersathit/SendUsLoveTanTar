import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatWeddingDate, isValidWeddingDate } from '../src/lib/weddingDate';

test('วันที่จัดงานตรวจวันจริง รวม leap year และปฏิเสธข้อมูลที่ผิดรูปแบบ', () => {
  for (const value of ['2026-10-24', '2028-02-29', '0001-01-01', '9999-12-31']) assert.equal(isValidWeddingDate(value), true, value);
  for (const value of ['', '2026-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-1-01', '24/10/2026', '0000-01-01', '2026-10-24T00:00:00Z']) assert.equal(isValidWeddingDate(value), false, value);
});

test('แสดงวันที่ภาษาไทยปี พ.ศ. โดยไม่เลื่อนวันตาม timezone', () => {
  assert.equal(formatWeddingDate('2026-10-24'), '24 ตุลาคม 2569');
  assert.equal(formatWeddingDate('2026-01-01'), '1 มกราคม 2569');
  assert.equal(formatWeddingDate(null), '');
  assert.equal(formatWeddingDate('2026-02-29'), '');
});
