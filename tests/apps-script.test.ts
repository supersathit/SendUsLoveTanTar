import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');
function app({ sharingFails = false } = {}) {
  const files: { mime: string; name: string; shared: boolean; trashed: boolean }[] = [];
  const scope = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key: string) => ({ UPLOAD_TOKEN: 'test-token', FOLDER_ID: 'test-folder' })[key] }) },
    Utilities: {
      base64Decode: (data: string) => [...Buffer.from(data, 'base64')],
      getUuid: () => '12345678-test-id', newBlob: (bytes: number[], mime: string, name: string) => ({ bytes, mime, name }),
    },
    DriveApp: {
      Access: { ANYONE_WITH_LINK: 'anyone' }, Permission: { VIEW: 'view' },
      getFolderById: (id: string) => {
        assert.equal(id, 'test-folder');
        return { createFile: (blob: { mime: string; name: string }) => {
          const file = { ...blob, shared: false, trashed: false }; files.push(file);
          return { setSharing: () => { if (sharingFails) throw new Error('denied'); file.shared = true; }, setTrashed: (value: boolean) => { file.trashed = value; }, getId: () => 'drive-file-id' };
        } };
      },
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (text: string) => ({ setMimeType: () => JSON.parse(text) }) },
  };
  const doPost = runInNewContext(source + '\ndoPost', scope) as (e: unknown) => { ok: boolean; error?: string; fileId?: string };
  return { files, post: (body: unknown) => doPost({ postData: { contents: JSON.stringify(body) } }), raw: doPost };
}
const payload = { token: 'test-token', filename: 'my-photo.jpg', mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, 1]).toString('base64') };
test('Apps Script ปฏิเสธ token ผิด ไม่สร้างไฟล์', () => {
  const { post, files } = app();
  assert.equal(post({ ...payload, token: 'wrong' }).ok, false); assert.equal(files.length, 0);
});
test('Apps Script รับ JPEG และแชร์ไฟล์พร้อมตอบ fileId', () => {
  const { post, files } = app();
  assert.equal(post(payload).fileId, 'drive-file-id');
  assert.equal(files[0].shared, true);
  assert.match(files[0].name, /^wish_\d+_12345678\.jpg$/);
});
test('Apps Script ปฏิเสธ MIME ที่ไม่รองรับและไฟล์ปลอมแม้ MIME เป็นรูป', () => {
  const { post, files } = app();
  assert.equal(post({ ...payload, mimeType: 'image/svg+xml' }).ok, false);
  assert.equal(post({ ...payload, data: Buffer.from('<html>not an image</html>').toString('base64') }).ok, false);
  assert.equal(files.length, 0);
});
test('Apps Script ปฏิเสธรูปเกิน 3 MB และรับที่ขอบเขต 3 MB', () => {
  const { post, files } = app();
  const bytes = Buffer.alloc(3 * 1024 * 1024); bytes[0] = 255; bytes[1] = 216; bytes[2] = 255;
  assert.equal(post({ ...payload, data: bytes.toString('base64') }).ok, true);
  assert.equal(post({ ...payload, data: Buffer.concat([bytes, Buffer.from([0])]).toString('base64') }).ok, false);
  assert.equal(files.length, 1);
});
test('Apps Script ล้างไฟล์ที่เปิดแชร์ไม่ได้ และไม่เปิดเผย exception ภายใน', () => {
  const { post, files, raw } = app({ sharingFails: true });
  assert.equal(post(payload).ok, false); assert.equal(files[0].trashed, true);
  assert.equal(raw({ postData: { contents: '{' } }).ok, false);
  assert.equal(raw(null).ok, false);
});
test('Apps Script ตรวจ signature PNG และ WebP', () => {
  const { post } = app();
  assert.equal(post({ ...payload, mimeType: 'image/png', data: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64') }).ok, true);
  assert.equal(post({ ...payload, mimeType: 'image/webp', data: Buffer.from('RIFF0000WEBP').toString('base64') }).ok, true);
});
