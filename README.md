# เว็บคำอวยพรงานแต่ง ณิชมนต์ & สถิตย์

เว็บภาษาไทยสำหรับให้แขกเขียนคำอวยพรจากมือถือ แนบรูปไป Google Drive และแสดงข้อความบนจอในงานแบบเรียลไทม์ พร้อมหน้าแอดมินสำหรับจัดการและส่งออกข้อมูล สร้างด้วย React 18, TypeScript strict, Vite, Tailwind CSS, Supabase และ Google Apps Script

URL สำหรับ GitHub Pages:

- [เขียนคำอวยพร](https://supersathit.github.io/SendUsLoveTanTar/#/write)
- [จอแสดงคำอวยพร](https://supersathit.github.io/SendUsLoveTanTar/#/display)
- [หน้าแอดมิน](https://supersathit.github.io/SendUsLoveTanTar/#/admin)

## สถานะ Supabase ของโปรเจกต์นี้

ตั้งค่าฐานข้อมูลจริงเมื่อ 18 ตุลาคม 2569:

- โปรเจกต์: [SendUsLoveTanTar](https://supabase.com/dashboard/project/mxdflivjzurkuwdcxasc) ในองค์กร TeachFolio แผน Free, region Singapore
- Project URL: `https://mxdflivjzurkuwdcxasc.supabase.co`
- ติดตั้ง `wishes`, `admins`, indexes และ `is_admin()` แล้ว
- ตรวจ RLS เปิดทั้งสองตาราง และมี policies ของ `wishes` ครบ 5 รายการ
- ตรวจ `wishes` อยู่ใน publication `supabase_realtime` แล้ว
- เพิ่ม `tatansathit.w@gmail.com` ในตาราง `admins` แล้ว
- `.env` ของเครื่องนี้มี Project URL, Publishable key และ `VITE_BASE=/SendUsLoveTanTar/` พร้อมใช้แล้ว
- ทดสอบ API จริงผ่าน: anon อ่านคำอวยพรได้, `is_admin()` คืน false สำหรับ anon และอ่านตาราง `admins` ถูกปฏิเสธตามสิทธิ์
- ทดสอบ Realtime จริงผ่าน: สมัคร Postgres Changes ของ `wishes` ได้ และส่ง/รับ broadcast บน `wishes-control` ระหว่างสอง client สำเร็จ โดยไม่ได้เพิ่มข้อความทดสอบลงฐานข้อมูล
- Production build ผ่านพร้อมค่า Supabase จริง
- เพิ่ม `wedding_settings` สำหรับวันที่จัดงานแล้ว เปิด RLS ให้ทุกคนอ่านได้และเฉพาะแอดมินแก้วันที่ได้ พร้อมเปิด Realtime

การเพิ่มอีเมลในตาราง `admins` ยังไม่สร้างบัญชี Auth ให้ หากยังไม่ได้สร้าง ต้องไป [Authentication → Users](https://supabase.com/dashboard/project/mxdflivjzurkuwdcxasc/auth/users) สร้างบัญชีด้วยอีเมลเดียวกัน ตั้งรหัสผ่านด้วยตนเอง และยืนยันอีเมลตามขั้นตอนด้านล่าง ยังไม่ได้ตรวจยืนยันการเข้าสู่ระบบของแอดมินหรือการส่งคำอวยพรจริง

ตรวจ Auth settings แล้ว: Email + Password เปิดอยู่ แต่ public sign-up ยังเปิดอยู่ ให้ไป [Sign In / Providers](https://supabase.com/dashboard/project/mxdflivjzurkuwdcxasc/auth/providers) ปิด **Allow new users to sign up** ตามข้อ 1.5 ด้านล่าง เครื่องมืออ่านและควบคุมหน้าตั้งค่า Auth ใน Chrome ยังมีปัญหา จึงยังไม่ได้เปลี่ยนค่านี้

การแนบรูปเชื่อม Apps Script กับโฟลเดอร์ Google Drive แล้ว และตั้ง `VITE_UPLOAD_ENDPOINT` / `VITE_UPLOAD_TOKEN` ใน `.env` ของเครื่องนี้แล้ว ทดสอบอัปโหลดผ่านเบราว์เซอร์และแสดงรูปกลับสำเร็จ รวมถึงเปิด Drive thumbnail และ URL สำรองโดยไม่ล็อกอินได้ (HTTP 200, image/jpeg)

`.env` ถูก ignore จาก Git; เมื่อนำขึ้น GitHub Pages ต้องตั้ง GitHub Secrets แยกอีกครั้งตามหัวข้อ 3

## เริ่มต้นบนเครื่อง

ใช้ Node.js **20.19 ขึ้นไป** (หรือ Node 22.12 ขึ้นไป) แล้วรัน:

```bash
npm install
cp -n .env.example .env
npm run dev
```

เปิด URL ที่ Vite แสดงใน terminal โดยใช้พาธ `/SendUsLoveTanTar/` (พอร์ตอาจเป็น 5173 หรือ 5174 ตามพอร์ตที่ว่าง) ค่าเริ่มต้นเมื่อไม่มี `VITE_BASE` คือ `/SendUsLoveTanTar/` แล้วเลือกเส้นทาง:

| หน้า | เส้นทาง | การใช้งาน |
| --- | --- | --- |
| แขก | `#/write` | เขียนคำอวยพรและแนบรูป |
| จอในงาน | `#/display` | แสดงการ์ดล่าสุด 40 ใบ, QR และเปิดเต็มจอ |
| ผู้ดูแล | `#/admin` | เข้าสู่ระบบ จัดการคำอวยพร ดาวน์โหลด CSV และ QR |

`#/` จะไป `#/write` อัตโนมัติ ยังไม่ใส่ค่า `.env` ก็เปิดดูหน้าตาได้ แต่จะไม่เปิดให้ส่งข้อความหรือล็อกอิน และไม่มีข้อมูลจำลองปะปนกับงานจริง

แก้ชื่อบ่าวสาวใน `src/config/wedding.ts` ส่วน **วันที่จัดงานตั้งในหน้าแอดมิน** ตามหัวข้อถัดไป ใช้สีโกโก้ ครีม และทอง พร้อมฟอนต์ **Playpen Sans Thai, Cormorant Garamond, Yesteryear** จาก [เว็บ WeddingTanTar](https://supersathit.github.io/WeddingTanTar/) สีและฟอนต์กำหนดใน `src/styles/theme.css` และ map ไว้ใน `tailwind.config.js` โลโก้และไอคอนเว็บใช้ `img/logo-cover.svg` ซึ่งคัดลอกไว้ใน `public/logo-cover.svg`

## ตั้งวันที่จัดงานในหน้าแอดมิน

1. เข้าสู่ระบบที่ `#/admin` แล้วไปกล่อง **วันที่จัดงาน** เหนือสถิติคำอวยพร
2. เลือกวันที่ด้วยปี ค.ศ. เช่น `2026-10-24` แล้วกด **บันทึกวันที่** หน้าตัวอย่างจะแสดงเป็น `24 ตุลาคม 2569`
3. วันที่บันทึกใน Supabase จึงใช้ร่วมกันทุกเครื่อง หน้าเขียนคำอวยพรจะอ่านเมื่อเปิดหรือกลับเข้าแท็บ จอในงานและหน้าแอดมินรับวันที่ใหม่ผ่าน Realtime พร้อมอ่านซ้ำทุก 30 วินาที

หากยังไม่กำหนดวันที่ เว็บจะแสดง “ยังไม่กำหนดวันที่” ไม่ต้องแก้โค้ดหรือ deploy ใหม่เมื่อเปลี่ยนวันที่

สำหรับ Supabase ที่ติดตั้ง schema รุ่นเดิมแล้ว ให้รัน `supabase/migrations/20261018_wedding_settings.sql` ทั้งไฟล์ใน SQL Editor เพียงครั้งเดียว (รันซ้ำได้และไม่รีเซ็ตวันที่ที่เคยบันทึก) โปรเจกต์ใหม่ใช้ `supabase/schema.sql` ได้ตามปกติ ส่วนโปรเจกต์ SendUsLoveTanTar ด้านบนติดตั้ง migration นี้แล้ว

## 1. ตั้งค่า Supabase

1. สร้างโปรเจกต์ที่ [Supabase](https://supabase.com/dashboard) เลือก region ที่ใกล้สถานที่จัดงาน แล้วรอฐานข้อมูลพร้อม
2. เปิด **SQL Editor → New query** คัดลอก `supabase/schema.sql` ทั้งไฟล์แล้ว Run ไฟล์นี้สร้างตาราง, constraints, indexes, ฟังก์ชัน `is_admin()`, RLS และเพิ่ม `wishes` เข้า `supabase_realtime` โดยรันซ้ำได้
3. ไป **Authentication → Users → Add user → Create new user** สร้างอีเมลและรหัสผ่านของผู้ดูแล ยืนยันอีเมล/เลือก Auto Confirm หาก Dashboard มีตัวเลือกนี้
4. เพิ่มอีเมลเดียวกันใน SQL Editor:

   ```sql
   insert into public.admins (email)
   values ('your-admin@example.com')
   on conflict (email) do nothing;
   ```

5. ไป **Authentication → Sign In / Providers** ปิด **Allow new users to sign up** หรือ public sign-up ใช้ Email + Password เท่านั้น และสร้างผู้ดูแลจาก Dashboard การใส่อีเมลลง `admins` อย่างเดียวไม่สร้าง Auth user ให้
6. ตรวจ **Database → Publications → supabase_realtime** ว่ามีตาราง `public.wishes` หรือใช้ SQL:

   ```sql
   select schemaname, tablename from pg_publication_tables
   where pubname = 'supabase_realtime';
   ```

7. Realtime ต้องอนุญาต public channels เพื่อใช้ broadcast ชื่อ `wishes-control` หากเปิดตัวเลือกอนุญาตเฉพาะ private channels ไว้ ให้ปรับตามการออกแบบนี้ หรือเปลี่ยนเป็น private broadcast พร้อมกำหนด Realtime authorization ก่อนใช้
8. คัดลอก **Project URL** และ **anon/public key** จากหน้า Connect / API Keys ไปใส่ `.env`:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
   ```

สิทธิ์ของฐานข้อมูล: anon เพิ่มคำอวยพรได้และอ่านเฉพาะที่ไม่ซ่อน; ผู้ใช้ที่ล็อกอินเพิ่มข้อความได้แต่จะอ่าน/แก้ไข/ลบได้ก็ต่อเมื่อ `is_admin()` เป็นจริง ตาราง `admins` ไม่เปิดให้อ่านหรือแก้จากเว็บ หน้าแขกและจอใช้ client แบบ anon แยกจาก session แอดมินเสมอ จึงเปิดทั้งสามหน้าในเครื่องเดียวกันได้

อ้างอิง [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) และ [Broadcast](https://supabase.com/docs/guides/realtime/broadcast)

## 2. ตั้งค่า Google Drive และ Apps Script

โปรเจกต์นี้เผยแพร่ [Apps Script: SendUsLoveTanTar Upload](https://script.google.com/home/projects/1r7dvlUD0kzweIsuDKE--xCqvXyRuzx0HPpCX-nPaL-xWzu-j155Vjtzm/edit) เวอร์ชัน 1 แล้ว โดยใช้ Execute as Me (`sathit@wr.ac.th`) / Anyone และตั้ง `FOLDER_ID` ให้ใช้โฟลเดอร์ [ภาพอวยพร](https://drive.google.com/drive/folders/1NthsUodOJpKeIzIOaF0cp7nb6H6RZsrn) ตั้ง `UPLOAD_TOKEN` และ URL `/exec` ใน `.env` ของเครื่องนี้ครบแล้ว ทดสอบรูป JPEG ขนาด 800 × 500 ผ่านฟังก์ชัน `uploadImage` และ `DriveImage` ในเบราว์เซอร์สำเร็จ โดยไม่เพิ่มคำอวยพรทดสอบลงฐานข้อมูล

Web App endpoint: `https://script.google.com/macros/s/AKfycbwi5E-DTPupbpwi_h0HjjQ8rLrGXSKcHxA9sVvc3ke4N_RpgHkFVN6fvhy9oS3VOZFv/exec`

เมื่อนำเว็บขึ้น GitHub Pages ให้ตั้ง `VITE_UPLOAD_ENDPOINT` และ `VITE_UPLOAD_TOKEN` ใน GitHub Secrets ตามหัวข้อ 3 ด้วย เพราะ `.env` ในเครื่องไม่ได้ถูกส่งขึ้น Git

1. สร้างโฟลเดอร์ใหม่ใน Google Drive สำหรับรูปคำอวยพร เปิดโฟลเดอร์แล้วคัดลอกส่วน ID หลัง `/folders/` ใน URL
2. เปิด [Google Apps Script](https://script.google.com/) สร้างโปรเจกต์ใหม่ คัดลอก `apps-script/Code.gs` แทนโค้ดในไฟล์ `Code.gs`
3. เปิด **Project Settings → Script Properties** เพิ่ม:

   | Property | ค่า |
   | --- | --- |
   | `FOLDER_ID` | ID โฟลเดอร์ที่สร้างในข้อ 1 |
   | `UPLOAD_TOKEN` | ข้อความสุ่มยาวที่สร้างเอง และใช้ค่าเดียวกับ `VITE_UPLOAD_TOKEN` |

4. กด **Deploy → New deployment → Web app** ตั้ง **Execute as: Me** และ **Who has access: Anyone** จากนั้น Deploy และอนุญาตเข้าถึง Drive หากบัญชี Workspace จำกัด Anyone หรือแชร์ไฟล์ภายนอก ต้องใช้บัญชีที่อนุญาตสิทธิ์เหล่านี้
5. คัดลอก URL ที่ลงท้าย `/exec` ไม่ใช้ URL `/dev` แล้วใส่ใน `.env`:

   ```dotenv
   VITE_UPLOAD_ENDPOINT=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   VITE_UPLOAD_TOKEN=YOUR_UPLOAD_TOKEN
   ```

6. หากแก้ Script ภายหลัง ไป **Deploy → Manage deployments → Edit → New version → Deploy** ไม่ใช่เพียงกด Save
7. ลองแนบรูปจากเว็บจริงและเปิดในหน้าต่างไม่ระบุตัวตน รูปต้องเห็นได้โดยไม่ล็อกอิน Google หากมีข้อผิดพลาดอัปโหลด เว็บจะถามให้ส่งเฉพาะข้อความได้

Client แปลงรูปเป็น JPEG แล้วย่อให้ด้านยาวไม่เกิน 1,600 px และเป้าหมายไม่เกิน 0.8 MB ส่ง JSON ด้วย `Content-Type: text/plain;charset=utf-8` เพื่อไม่ให้เกิด CORS preflight และติดตาม redirect ของ ContentService ห้ามเปลี่ยนเป็น `application/json` หรือใช้ `mode: no-cors` เพราะจะอ่าน `fileId` ไม่ได้ ดู [Apps Script Web Apps](https://developers.google.com/apps-script/guides/web) และ [Content Service](https://developers.google.com/apps-script/guides/content)

Script ตรวจ token, MIME, file signature และขนาดหลัง decode ไม่เกิน 3 MB รับ JPG, PNG และ WebP ตั้งชื่อ `wish_<timestamp>_<random>.jpg` และแชร์ให้ทุกคนที่มีลิงก์ดูได้ หน้าเว็บใช้ Drive thumbnail ก่อน แล้วลอง `lh3.googleusercontent.com` หากโหลดรูปไม่ได้ทั้งสอง URL จะเหลือการ์ดข้อความตามปกติ

`VITE_UPLOAD_TOKEN` ถูกฝังในเว็บสาธารณะตามรูปแบบที่โจทย์กำหนด จึงใช้คัดกรอง request ทั่วไป ไม่ใช่ความลับที่ป้องกันผู้โจมตีได้ ควรใช้โฟลเดอร์เฉพาะงาน ตรวจพื้นที่และโควตา และปิด deployment หลังเลิกเปิดรับรูป รูปที่ถูกลบออกจากคำอวยพรยังอยู่ใน Drive; หากอัปโหลดสำเร็จแต่ผู้ใช้ไม่ส่งข้อความ อาจมีไฟล์ที่ไม่ถูกอ้างอิง ให้ตรวจโฟลเดอร์หลังงานก่อนลบเอง

## 3. เผยแพร่ GitHub Pages

1. สร้าง repository แล้วนำโค้ดนี้ขึ้น branch `main` ใช้ชื่อ `wedding-wishes` ได้ตามค่าเริ่มต้น
2. เปิด **Settings → Secrets and variables → Actions → New repository secret** เพิ่มค่าทั้งสี่จาก `.env`:

   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_UPLOAD_ENDPOINT`
   - `VITE_UPLOAD_TOKEN`

3. GitHub workflow ใช้พาธตามชื่อ repository อัตโนมัติ เช่น `/SendUsLoveTanTar/` หากต้องการเปลี่ยน เปิดแท็บ **Variables** เพิ่ม `VITE_BASE` เป็นพาธที่ต้องการ ถ้าใช้ root domain ให้เป็น `/` ค่าเดียวกันตั้งใน `.env` ของเครื่องได้
4. ไป **Settings → Pages → Build and deployment → Source** เลือก **GitHub Actions**
5. Push เข้า `main` หรือเปิด **Actions → เผยแพร่เว็บคำอวยพร → Run workflow** Workflow ใช้ Node 22, `npm ci`, tests, TypeScript check และ production build แล้วส่ง `dist` ด้วย `actions/upload-pages-artifact` และเผยแพร่ด้วย `actions/deploy-pages`
6. เปิด URL ที่ job deploy แสดง สำหรับโปรเจกต์นี้คือ `https://supersathit.github.io/SendUsLoveTanTar/#/write` แล้วตรวจว่า logo, font และ routes โหลดได้เมื่อรีเฟรช
7. เข้า `#/admin` บน **URL ที่เผยแพร่แล้ว** เพื่อดาวน์โหลด QR PNG ขนาด 2,048 × 2,048 px ระบบสร้าง URL จากหน้าที่เปิดอยู่ หากดาวน์โหลดตอนเปิด localhost QR จะชี้ไป localhost และแขกใช้ไม่ได้

ค่า `VITE_*` ใช้ตอน build ทุกครั้ง หากเปลี่ยน GitHub Secrets ต้อง deploy ใหม่ อย่า commit `.env` การใช้ anon/public key ใน frontend เป็นปกติ แต่ความปลอดภัยต้องอาศัย RLS ที่ติดตั้งไว้

อ้างอิง [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## 4. การทำงานในวันงาน

- จอเรียงการ์ดปักหมุดก่อน ตามด้วยใหม่สุด และแสดงสูงสุด 40 ใบ ตัวนับบนจอเป็นจำนวน **ที่เปิดแสดงทั้งหมด** รวมใบเก่าที่ไม่ได้อยู่ใน 40 ใบ เพื่อไม่เปิดเผยข้อมูลที่ซ่อนอยู่ ส่วนหน้าแอดมินนับทุกข้อความ
- เมื่อ INSERT เข้ามา จออ่านข้อมูลที่ผ่าน RLS และนำการ์ดใหม่มาเป็นใบแรกชั่วคราว เลื่อนทั้งกระดานและหน้าเว็บกลับบนสุดภายใน 0.65 วินาทีก่อนแสดงการ์ดตรงกลางหน้าจอและขยายประมาณ 2 เท่า ค้างที่ขนาดใหญ่ 3 วินาที แล้วเคลื่อนพร้อมย่อกลับไปยังตำแหน่งใบแรกในกระดาน มี blur, glow สีทอง และประกายหัวใจ พร้อม `layout`/`AnimatePresence` ให้การ์ดเดิมขยับอย่างนุ่มนวล
- คำอวยพรที่เข้ามาพร้อมกันแสดงทีละใบ รอให้ใบก่อนย่อกลับก่อน (ประมาณ 5 วินาทีต่อใบ รวมเวลาเลื่อนกลับบนสุด) จอหยุด auto-scroll และตรึงตำแหน่งด้านบนระหว่างนำเสนอ หลังจบจะคืนลำดับปักหมุดตามเดิม ขนาดขยายลดลงเมื่อพื้นที่จอไม่พอ และกลับบนสุดทันทีพร้อมงดขยายเมื่อเปิดลดการเคลื่อนไหวในเครื่อง
- แอดมินแก้ฐานข้อมูลก่อน แล้ว broadcast `hide`, `unhide`, `pin` หรือ `delete` ไป `wishes-control` ผู้รับใช้เป็นสัญญาณอ่านฐานข้อมูลใหม่ **ไม่ใช้ข้อมูล broadcast สาธารณะตัดสินสิทธิ์หรือแก้การ์ดโดยตรง** จึงไม่เชื่อคำสั่งปลอมให้แสดงข้อความที่ RLS ปิดไว้
- จอและแอดมินอ่านซ้ำทุก 30 วินาทีเพื่อกู้ข้อมูลที่ตกหล่น และสมัคร channel ใหม่เมื่อ `CLOSED`, `CHANNEL_ERROR`, `TIMED_OUT` พร้อม retry backoff หน้าแขกไม่ subscribe Realtime
- ถ้าเนื้อหายาวเกินจอ จะเลื่อนช้า ๆ และวนกลับด้านบน ขยับเมาส์แล้วหยุดชั่วคราวเพื่อให้ทีมงานควบคุมได้ ปุ่มเต็มจอและ cursor ซ่อนเมื่อไม่ขยับ 3 วินาที
- ขอ Screen Wake Lock เมื่อเบราว์เซอร์รองรับ และขอใหม่เมื่อกลับเข้าแท็บ หากระบบปฏิเสธ เช่น แบตเตอรี่ต่ำ ให้ตั้งค่าจอไม่ให้พักด้วยเครื่องเอง
- จำกัดการส่งทุก 30 วินาทีใน localStorage และมี honeypot; เป็นการกันส่งรัวในเบราว์เซอร์ ไม่ใช่ server rate limit ผู้ที่เรียก API เองยังเลี่ยงได้ หากเปิดรับในวงกว้างควรเสริม rate limiting ที่ backend
- แอดมินส่งออก CSV **ทุกข้อความ** รวมที่ซ่อน ใส่ UTF-8 BOM สำหรับ Excel และป้องกันข้อความที่ถูกตีความเป็นสูตร ไม่ได้ส่งออกเฉพาะผลค้นหา การค้นหาและตัวกรองใช้ดูรายการเท่านั้น

## 5. ตรวจสอบก่อนวันงาน

- [ ] ตั้งวันที่จริงในหน้าแอดมิน ตรวจการแสดงปี พ.ศ. ทั้งหน้าแขกและจอในงาน และตรวจชื่อบ่าวสาวใน `src/config/wedding.ts`
- [ ] รัน `npm install`, `npm test` และ `npm run build` ผ่าน
- [ ] RLS เปิดทั้ง `wishes` และ `admins`; แขก UPDATE/DELETE ไม่ได้ และส่ง `is_hidden`/`is_pinned` เป็น true ไม่ได้
- [ ] บัญชีแอดมินเข้าถึงได้ ผู้ใช้ Auth ที่ไม่มีใน `admins` เห็น “ไม่มีสิทธิ์เข้าถึง”
- [ ] ทดลองด้วยมือถือ 3–4 เครื่องพร้อมกัน ทั้งข้อความอย่างเดียวและพร้อมรูป
- [ ] ส่งชื่อ/คำอวยพรว่างหลัง trim ไม่ได้ ตัวนับและความยาว 50/500 ทำงาน และ cooldown ไม่หายเมื่อรีเฟรช
- [ ] อัปโหลดรูปแนวตั้ง แนวนอน JPG, PNG, WebP และลบ preview ได้
- [ ] ทดสอบกรณี Apps Script ใช้งานไม่ได้แล้วเลือกส่งเฉพาะข้อความ
- [ ] เปิดรูปในหน้าต่างไม่ระบุตัวตนและทดสอบ fallback เมื่อ Drive URL แรกโหลดไม่ได้
- [ ] เปิดจอจริง 1920×1080 และตรวจอ่านข้อความจากระยะที่จะใช้จริง
- [ ] ส่งหลายข้อความพร้อมกันแล้วดูคิว เอฟเฟกต์ และการปักหมุดไม่มีการ์ดซ้ำ
- [ ] ซ่อน/แสดง/ปักหมุด/เลิกปักหมุด/ลบแล้วตรวจจอทันที ลบมี dialog ยืนยัน
- [ ] ตัดเน็ตจอแล้วเปิดใหม่ ตรวจการเชื่อมต่อและการอ่านข้อมูลใหม่ภายในรอบ 30 วินาที
- [ ] มีคำอวยพรเกิน 40 ใบแล้วตรวจจำนวนบนจอและ auto-scroll
- [ ] ดาวน์โหลด CSV เปิดด้วย Excel ภาษาไทยไม่เพี้ยน และมีข้อความหลายบรรทัดครบ
- [ ] ดาวน์โหลด QR จาก URL production และใช้มือถือสแกนก่อนพิมพ์ป้าย
- [ ] ใช้ HTTPS, เสียบไฟ, เปิดเต็มจอ และปิดการพักจอของเครื่องหาก Wake Lock ไม่รองรับ
- [ ] ทดสอบ Wi-Fi งานจริง เตรียมอินเทอร์เน็ตสำรอง และ export ข้อมูลสำรองหลังงาน

## 6. ป้องกัน Supabase Free ถูกพัก

Supabase ระบุว่าโปรเจกต์ Free ที่มีกิจกรรมฐานข้อมูลต่ำในช่วง 7 วันอาจถูกพัก จึงไม่ควรตั้งค่าแล้วปล่อยไว้จนวันงาน:

1. ระหว่างเตรียมงาน ใช้งานและทดสอบการรับคำอวยพรจริงเป็นระยะ พร้อมตรวจ Dashboard และอีเมลแจ้งเตือน
2. ก่อนงาน 1–2 วัน และก่อนเปิดงาน ตรวจสถานะโปรเจกต์ ทดสอบส่งข้อความพร้อมรูป แล้วลบข้อความทดสอบในหน้าแอดมิน
3. หากถูกพัก ให้ Restore จาก Dashboard และรอจนบริการพร้อม ก่อนทดสอบใหม่ครบทั้งสามหน้า การเปิดเว็บ GitHub Pages อย่างเดียวไม่ได้ยืนยันว่าฐานข้อมูลพร้อม
4. หากต้องการหลีกเลี่ยงการพักอัตโนมัติในวันสำคัญ ให้พิจารณาแผนที่ไม่มีการพักจาก inactivity ตรวจเงื่อนไขและค่าใช้จ่ายล่าสุดของ Supabase ก่อนเลือก

ไม่มีวิธีทดสอบหรือ ping เพียงครั้งเดียวที่รับประกันว่าจะไม่ถูกพัก ดูเงื่อนไขล่าสุดจาก [Supabase Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing)

## การตรวจสอบโค้ดและขอบเขต

```bash
npm test
npm run build
npm run preview
```

Tests 26 กรณีทดสอบตำแหน่งกึ่งกลางและขนาดการ์ดไม่ล้นจอ, คิวข้อความ, เลื่อนกระดานและหน้าเว็บถึงบนสุดก่อนขยายและตรึงตำแหน่งระหว่างนำเสนอ, ยกเลิกการเลื่อนเมื่อเปลี่ยนการ์ด, โหมดลดการเคลื่อนไหว, จังหวะขยายและค้าง 3 วินาทีก่อนเริ่มใบถัดไป, คืนลำดับปักหมุดหลังโฟกัส, ปรับขนาดให้พอดีจอ, การคืนข้อมูลหลัง reconnect, hidden/deleted ก่อนออกจากคิว, จำกัด 40 ใบ, CSV และ Apps Script ด้วย Drive mock (token, MIME, signature, ขอบเขต 3 MB, การแชร์ล้มเหลว) รวมถึงการตรวจวันที่จริง/leap year, รูปแบบวันที่ไทยปี พ.ศ., รัน `schema.sql`/migration ซ้ำโดยรักษาวันที่เดิม และตรวจ RLS ของคำอวยพรและวันที่ใน PostgreSQL แบบ in-memory ด้วย PGlite Tests ไม่เชื่อมบัญชี Supabase หรือ Drive ของจริง ต้องใช้ checklist ข้างบนทดสอบหลังตั้งค่าบริการ

โครงสร้างไฟล์:

```text
src/config/wedding.ts       ชื่อบ่าวสาวและข้อความสำรอง
src/styles/theme.css        สีและฟอนต์
src/lib/                   clients, types, upload, Drive URLs, CSV และคิว
src/hooks/                 auth, cooldown และ Realtime
src/components/            ฟอร์ม การ์ด QR และส่วนตกแต่ง
src/pages/                 write / display / admin
supabase/schema.sql        ติดตั้งฐานข้อมูลและ RLS
supabase/migrations/       อัปเกรดฐานข้อมูลรุ่นเดิมโดยรักษาข้อมูล
apps-script/Code.gs        อัปโหลดรูปไป Google Drive
.github/workflows/deploy.yml
tests/                     tests ที่ไม่พึ่งบริการภายนอก
```

ไฟล์ `Html.html`, `Prompt_Codex.md` และ `img/` เดิมเก็บไว้เป็นเอกสารอ้างอิง เว็บใช้งานจริงเข้าจาก `index.html` และ `src/`
