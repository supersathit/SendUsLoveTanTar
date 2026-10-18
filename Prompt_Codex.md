# งาน: สร้างเว็บ "คำอวยพรงานแต่ง" แบบ Realtime

## เป้าหมาย
เว็บให้แขกสแกน QR แล้วเขียนคำอวยพรจากมือถือ (แนบรูปได้หรือไม่แนบก็ได้)
คำอวยพรขึ้นจอใหญ่ในงานแบบ realtime และมีหน้า admin สำหรับจัดการข้อความ
ข้อความบนหน้าเว็บทั้งหมดเป็นภาษาไทย

## ข้อมูลงาน
- เจ้าสาว: นางสาวณิชมนต์ ทองแก้ว
- เจ้าบ่าว: นายสถิตย์ วรรณสุข
- หัวเรื่องบนจอ: "ณิชมนต์ & สถิตย์"
- วันที่: [วันที่จัดงาน]
- เก็บค่าเหล่านี้ไว้ใน `src/config/wedding.ts` เพื่อให้แก้ได้ง่าย

## Tech Stack
- Vite + React 18 + TypeScript (strict)
- Tailwind CSS
- react-router-dom ใช้ **HashRouter** (เพราะ GitHub Pages ไม่รองรับ SPA routing)
- @supabase/supabase-js v2 (Database, Realtime, Auth)
- framer-motion (แอนิเมชัน)
- qrcode.react (QR code)
- browser-image-compression (ย่อรูปฝั่ง client)
- Google Apps Script (ตัวกลางอัปโหลดรูปเข้า Google Drive)
- Deploy: GitHub Pages ผ่าน GitHub Actions

## ธีมและสี
- กำหนดสีทั้งหมดเป็น CSS variables ใน `src/styles/theme.css` แล้ว map เข้า Tailwind config
  (ห้าม hardcode สีในคอมโพเนนต์)
- ถ้าเข้าถึงอินเทอร์เน็ตได้ ให้ดึง palette และฟอนต์จาก https://supersathit.github.io/WeddingTanTar/
  มาใช้แทนค่าเริ่มต้น ถ้าเข้าไม่ได้ ให้ใช้ค่าเริ่มต้นนี้:
  - --color-bg: #FBF7F2 (ครีม)
  - --color-surface: #FFFFFF
  - --color-primary: #B8925A (ทอง)
  - --color-primary-dark: #8C6A3C
  - --color-accent: #E8C4C4 (ชมพูอ่อน)
  - --color-text: #4A3F35
  - --color-muted: #9A8C7E
- ฟอนต์ (Google Fonts): หัวเรื่องไทยใช้ "Charm", เนื้อหาใช้ "Prompt", ตัวอักษรตกแต่งอังกฤษใช้ "Great Vibes"
- บรรยากาศหรูหรา อ่อนโยน มีลวดลายดอกไม้หรือเส้นทองบางๆ (ใช้ SVG หรือ CSS ไม่ต้องใช้ไฟล์รูปภายนอก)

## Routes
- `#/` → redirect ไป `#/write`
- `#/write` → หน้าเขียนคำอวยพร (mobile-first)
- `#/display` → หน้าจอแสดงผลในงาน (ออกแบบสำหรับ 1920×1080 แนวนอน)
- `#/admin` → หน้าจัดการ (ต้องล็อกอิน)

## Environment Variables
สร้างไฟล์ `.env.example`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_UPLOAD_ENDPOINT=   # URL ของ Google Apps Script Web App
VITE_UPLOAD_TOKEN=      # shared secret ที่ตรงกับใน Apps Script
```
ห้ามใช้หรืออ้างถึง service_role key ในโค้ด frontend เด็ดขาด

## ฐานข้อมูล Supabase
สร้างไฟล์ `supabase/schema.sql` ที่รันใน SQL Editor ได้ในครั้งเดียว:

1. ตาราง `wishes`
   - id uuid primary key default gen_random_uuid()
   - created_at timestamptz default now()
   - guest_name text not null, check ความยาว 1–50
   - side text null, check in ('bride','groom','both')
   - message text not null, check ความยาว 1–500
   - image_file_id text null, check ความยาว ≤ 100
   - is_hidden boolean not null default false
   - is_pinned boolean not null default false
2. ตาราง `admins` (email text primary key) และฟังก์ชัน `is_admin()`
   แบบ security definer ที่เช็ก `auth.jwt()->>'email'` ว่าอยู่ในตาราง admins
3. เปิด RLS ใน wishes:
   - anon และ authenticated: INSERT ได้ โดย with check `is_hidden = false AND is_pinned = false`
   - anon: SELECT ได้เฉพาะ `is_hidden = false`
   - admin (`is_admin()`): SELECT, UPDATE และ DELETE ได้ทั้งหมด
   - ไม่มี policy UPDATE หรือ DELETE สำหรับ anon
4. เปิด RLS ในตาราง admins โดยไม่สร้าง policy ใดๆ ให้ anon
5. `alter publication supabase_realtime add table wishes;`
6. สร้าง index บน created_at desc
7. ใส่คอมเมนต์อธิบายทุกส่วน และตัวอย่างคำสั่ง insert email ของ admin

## อัปโหลดรูป: Google Apps Script
สร้างไฟล์ `apps-script/Code.gs`:
- `doPost(e)` รับ JSON `{ token, filename, mimeType, data(base64) }`
- ตรวจ token ให้ตรงกับ Script Property `UPLOAD_TOKEN`
- รับเฉพาะ mimeType image/jpeg, image/png, image/webp และขนาดหลัง decode ไม่เกิน 3MB
- บันทึกลงโฟลเดอร์ที่ระบุใน Script Property `FOLDER_ID`
  ตั้งชื่อไฟล์เป็น `wish_<timestamp>_<random>.jpg`
- `file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)`
- ตอบกลับเป็น JSON `{ ok: true, fileId }` หรือ `{ ok: false, error }`
- ฝั่ง client ต้องส่ง fetch ด้วย `Content-Type: text/plain;charset=utf-8`
  (เพื่อเลี่ยง CORS preflight ที่ Apps Script ไม่รองรับ)

แสดงรูปจาก Drive ผ่าน helper:
- URL หลัก: `https://drive.google.com/thumbnail?id=${id}&sz=w1000`
- ถ้าโหลดไม่ได้ (onError) ให้ fallback เป็น `https://lh3.googleusercontent.com/d/${id}=w1000`
- ถ้ายังโหลดไม่ได้อีก ให้ซ่อนรูปและแสดงเฉพาะข้อความ

## หน้า /write (แขก)
- Header ชื่อบ่าวสาว พร้อมลวดลายตกแต่ง
- ฟอร์ม:
  - ชื่อ (บังคับกรอก)
  - ฝ่าย (ตัวเลือกแบบ chip: ฝ่ายเจ้าสาว / ฝ่ายเจ้าบ่าว / ทั้งสองฝ่าย; ไม่บังคับ)
  - คำอวยพร (textarea พร้อมตัวนับ x/500)
  - แนบรูป (ไม่บังคับ) พร้อม preview และปุ่มลบรูป
- ขั้นตอนส่ง:
  1. ถ้ามีรูป: ย่อด้วย browser-image-compression (maxWidthOrHeight 1600, maxSizeMB 0.8, แปลงเป็น JPEG)
     แล้วอัปโหลดไป Apps Script พร้อมแสดงสถานะ "กำลังอัปโหลดรูป..."
  2. insert ลง Supabase พร้อม image_file_id
  3. ถ้าอัปโหลดรูปไม่สำเร็จ ให้ถามว่า "ส่งเฉพาะข้อความแทนไหม?"
- กันสแปม:
  - cooldown 30 วินาที (เก็บใน localStorage)
  - honeypot field ที่ซ่อนไว้
  - trim ข้อความ และห้ามส่งค่าว่าง
- เมื่อส่งสำเร็จ: แสดงหน้าขอบคุณ มีแอนิเมชันหัวใจหรือกลีบดอกไม้ และปุ่ม "เขียนคำอวยพรอีกครั้ง"
- หน้านี้ไม่ต้อง subscribe realtime

## หน้า /display (จอในงาน)
- Header: ชื่อบ่าวสาว, วันที่ และตัวนับ "คำอวยพรทั้งหมด N ข้อความ"
- การ์ดเรียงแบบ masonry (CSS columns 3–4 คอลัมน์ตามความกว้างจอ)
  - ใหม่สุดอยู่บน และการ์ดที่ถูกปักหมุด (is_pinned) อยู่บนสุดเสมอ
  - การ์ดมีรูป (ถ้ามี), ข้อความ, ชื่อ, ป้ายฝ่าย และเวลาแบบ relative
  - ตัวอักษรใหญ่ อ่านจากระยะไกลได้
- **เอฟเฟกต์การ์ดใหม่** (สำคัญ):
  - การ์ดเข้ามาด้วย scale 0.6→1, opacity 0→1, blur 8px→0 และ spring
  - มีขอบเรืองแสงสีทอง (glow) ประมาณ 4 วินาทีแล้วค่อยจางลง
  - มีอนุภาคหัวใจหรือประกายเล็กๆ กระจายรอบการ์ด
  - การ์ดเดิมขยับลงอย่างนุ่มนวลด้วย framer-motion `layout` + `AnimatePresence`
  - ถ้ามีหลายข้อความเข้ามาพร้อมกัน ให้เข้าคิวแสดงทีละใบ ห่างกันประมาณ 1.2 วินาที
- จอเดียวแสดงได้จำนวนจำกัด ให้แสดงล่าสุด 40 ใบ
  ถ้าเนื้อหาเกินจอ ให้ auto-scroll ลงช้าๆ แล้ววนกลับขึ้นด้านบน
- QR code มุมขวาล่าง ชี้ไปที่ URL `#/write` (สร้างจาก window.location ห้าม hardcode)
  พร้อมข้อความ "สแกนเพื่อร่วมอวยพร"
- ปุ่ม fullscreen (ซ่อนเมื่อเมาส์ไม่ขยับ 3 วินาที) และซ่อน cursor เมื่อไม่ขยับ
- ใช้ Screen Wake Lock API เพื่อกันจอดับ (ถ้าเบราว์เซอร์รองรับ)
- Realtime:
  - subscribe `postgres_changes` event INSERT บน wishes
  - subscribe broadcast channel `wishes-control` เพื่อรับคำสั่ง `hide`, `unhide`, `pin` และ `delete` จาก admin
    (anon จะไม่ได้รับ UPDATE event ของแถวที่ถูกซ่อนเพราะติด RLS จึงต้องใช้ broadcast)
  - fallback: refetch ทุก 30 วินาทีแล้ว reconcile state
    และ resubscribe อัตโนมัติเมื่อสถานะเป็น CLOSED, CHANNEL_ERROR หรือ TIMED_OUT
  - แสดงจุดสถานะการเชื่อมต่อเล็กๆ ที่มุมจอ
- ป้องกันการ์ดซ้ำโดยเช็กจาก id

## หน้า /admin
- ล็อกอินด้วย Supabase Auth (email + password)
  - ถ้า email ไม่อยู่ในตาราง admins ให้แสดง "ไม่มีสิทธิ์เข้าถึง"
- ตารางหรือรายการคำอวยพรทั้งหมด รวมข้อความที่ซ่อนอยู่ พร้อมรูปย่อ
- ค้นหาตามชื่อหรือข้อความ และกรองตาม: ทั้งหมด / แสดงอยู่ / ซ่อนอยู่ / ปักหมุด / มีรูป
- Actions:
  - ซ่อน/แสดง และปักหมุด/เลิกปักหมุด: update DB แล้วส่ง broadcast ไปที่ `wishes-control`
  - ลบ: มี confirm dialog และส่ง broadcast
  - เปิดรูปใน Google Drive
- สถิติ: จำนวนทั้งหมด, จำนวนแยกตามฝ่าย และจำนวนที่มีรูป
- Export CSV (ใส่ UTF-8 BOM เพื่อให้ Excel แสดงภาษาไทยถูกต้อง)
  - คอลัมน์: เวลา, ชื่อ, ฝ่าย, ข้อความ, ลิงก์รูป, สถานะ
- ดาวน์โหลด QR code ของหน้า /write เป็น PNG ความละเอียดสูง (สำหรับพิมพ์ป้ายตั้งโต๊ะ)
- ปุ่มลัดเปิดหน้า /display ในแท็บใหม่
- realtime อัปเดตรายการเมื่อมีข้อความใหม่

## Deploy: GitHub Pages
- `vite.config.ts` ตั้ง `base` เป็น `'/wedding-wishes/'` (อ่านจาก env `VITE_BASE` ได้)
- สร้าง `.github/workflows/deploy.yml`:
  - trigger เมื่อ push เข้า main
  - build ด้วย Node 20 และ inject env จาก GitHub Secrets
  - deploy ด้วย actions/upload-pages-artifact + actions/deploy-pages
- ใส่ไฟล์ `public/.nojekyll`

## โครงสร้างโค้ด
- `src/lib/` → supabase client, upload helper, drive image helper, types
- `src/hooks/` → useWishesRealtime, useAuth, useCooldown
- `src/components/` → WishCard, WishForm, QRBadge, Decorations, ConnectionDot
- `src/pages/` → WritePage, DisplayPage, AdminPage
- มี type `Wish` ที่ตรงกับ schema
- จัดการ error ทุกจุดด้วยข้อความภาษาไทยที่เป็นมิตร

## สิ่งที่ต้องส่งมอบ
1. โค้ดครบทุกไฟล์ที่ `npm install && npm run build` ผ่านโดยไม่มี TypeScript error
2. `supabase/schema.sql`
3. `apps-script/Code.gs`
4. `README.md` ภาษาไทย อธิบายทีละขั้น:
   - สร้างโปรเจกต์ Supabase, รัน SQL, เพิ่ม admin user (แนะนำให้ปิด public sign-up)
     และเปิด Realtime
   - สร้างโฟลเดอร์ Google Drive, สร้าง Apps Script, ตั้ง Script Properties
     และ deploy เป็น Web App (Execute as: Me, Who has access: Anyone)
   - ใส่ GitHub Secrets และเปิด Pages (Source: GitHub Actions)
   - checklist ทดสอบก่อนวันงาน และการกันไม่ให้ Supabase free tier ถูก pause