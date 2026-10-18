/**
 * Script Properties ที่ต้องตั้ง: UPLOAD_TOKEN และ FOLDER_ID
 * Deploy Web app: Execute as Me / Who has access Anyone
 * รับ JSON ผ่าน Content-Type: text/plain;charset=utf-8
 */
function doPost(e) {
  try {
    var properties = PropertiesService.getScriptProperties();
    var expectedToken = properties.getProperty('UPLOAD_TOKEN');
    var folderId = properties.getProperty('FOLDER_ID');
    if (!expectedToken || !folderId) return jsonResponse_({ ok: false, error: 'ระบบอัปโหลดรูปยังไม่พร้อมใช้งาน' });
    if (!e || !e.postData || !e.postData.contents) return jsonResponse_({ ok: false, error: 'ไม่พบข้อมูลรูปภาพ' });
    // base64 ขยายขนาดประมาณ 4/3 จึงปฏิเสธ request ใหญ่ก่อน decode
    if (e.postData.contents.length > 4.3 * 1024 * 1024) return jsonResponse_({ ok: false, error: 'รูปภาพมีขนาดเกิน 3 MB' });
    var input = JSON.parse(e.postData.contents);
    if (!input || typeof input.token !== 'string' || input.token !== expectedToken) return jsonResponse_({ ok: false, error: 'ไม่มีสิทธิ์อัปโหลดรูปภาพ' });
    var allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.indexOf(input.mimeType) === -1) return jsonResponse_({ ok: false, error: 'รับเฉพาะ JPG, PNG หรือ WebP' });
    if (typeof input.data !== 'string' || !input.data || !/^[A-Za-z0-9+/]*={0,2}$/.test(input.data)) return jsonResponse_({ ok: false, error: 'ข้อมูลรูปภาพไม่ถูกต้อง' });
    var bytes = Utilities.base64Decode(input.data);
    if (bytes.length === 0 || bytes.length > 3 * 1024 * 1024) return jsonResponse_({ ok: false, error: 'รูปภาพต้องมีขนาดไม่เกิน 3 MB' });
    // ตรวจ file signature ป้องกันการส่งไฟล์อื่นโดยอ้าง MIME เป็นรูป
    if (!validImageSignature_(bytes, input.mimeType)) return jsonResponse_({ ok: false, error: 'ไฟล์นี้ไม่ใช่รูปภาพที่รองรับ' });
    var filename = 'wish_' + Date.now() + '_' + Utilities.getUuid().slice(0, 8) + '.jpg';
    var blob = Utilities.newBlob(bytes, input.mimeType, filename);
    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {
      // ไม่ทิ้งไฟล์ที่เปิดแชร์ไม่ได้ไว้ในโฟลเดอร์
      file.setTrashed(true);
      return jsonResponse_({ ok: false, error: 'เปิดแชร์รูปไม่ได้ กรุณาตรวจสอบสิทธิ์ Google Drive' });
    }
    return jsonResponse_({ ok: true, fileId: file.getId() });
  } catch (error) {
    // ไม่เปิดเผย token, folder id หรือรายละเอียดภายในให้ผู้ส่ง
    return jsonResponse_({ ok: false, error: 'อัปโหลดรูปไม่สำเร็จ กรุณาลองอีกครั้ง' });
  }
}

function validImageSignature_(bytes, mimeType) {
  var unsigned = function (index) { return bytes[index] & 255; };
  if (mimeType === 'image/jpeg') return bytes.length >= 3 && unsigned(0) === 255 && unsigned(1) === 216 && unsigned(2) === 255;
  if (mimeType === 'image/png') {
    var signature = [137, 80, 78, 71, 13, 10, 26, 10];
    return bytes.length >= 8 && signature.every(function (value, index) { return unsigned(index) === value; });
  }
  if (mimeType === 'image/webp') return bytes.length >= 12 && unsigned(0) === 82 && unsigned(1) === 73 && unsigned(2) === 70 && unsigned(3) === 70 && unsigned(8) === 87 && unsigned(9) === 69 && unsigned(10) === 66 && unsigned(11) === 80;
  return false;
}

function jsonResponse_(result) {
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
