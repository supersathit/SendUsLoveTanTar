import imageCompression from 'browser-image-compression';

export async function uploadImage(file: File): Promise<string> {
  const endpoint = import.meta.env.VITE_UPLOAD_ENDPOINT?.trim();
  const token = import.meta.env.VITE_UPLOAD_TOKEN?.trim();
  if (!endpoint || !token) throw new Error('ยังไม่พร้อมรับรูปภาพ กรุณาส่งเฉพาะคำอวยพรก่อนนะคะ');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('กรุณาเลือกรูปแบบ JPG, PNG หรือ WebP');
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 1600, maxSizeMB: 0.8, fileType: 'image/jpeg', useWebWorker: true,
    initialQuality: 0.85,
  });
  const dataUrl = await imageCompression.getDataUrlFromFile(compressed);
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow',
    body: JSON.stringify({ token, filename: file.name, mimeType: 'image/jpeg', data: dataUrl.split(',')[1] }),
    signal: AbortSignal.timeout(90000),
  });
  if (!response.ok) throw new Error('อัปโหลดรูปไม่สำเร็จ กรุณาลองอีกครั้ง');
  const result: unknown = await response.json();
  if (typeof result !== 'object' || result === null || !('ok' in result) || result.ok !== true || !('fileId' in result) || typeof result.fileId !== 'string' || !/^[\w-]{1,100}$/.test(result.fileId)) {
    throw new Error('อัปโหลดรูปไม่สำเร็จ กรุณาลองอีกครั้ง');
  }
  return result.fileId;
}
