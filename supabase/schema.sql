-- รันทั้งไฟล์ใน Supabase SQL Editor ด้วยบัญชีเจ้าของโปรเจกต์
-- ทำงานใน transaction เดียวและรันซ้ำได้ โดยไม่ลบคำอวยพรที่มีอยู่
begin;

-- ตารางคำอวยพร: บังคับความยาวและค่า enum ที่ฐานข้อมูลด้วย
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  guest_name text not null check (char_length(guest_name) between 1 and 50 and char_length(btrim(guest_name)) > 0),
  side text check (side in ('bride', 'groom', 'both')),
  message text not null check (char_length(message) between 1 and 500 and char_length(btrim(message)) > 0),
  image_file_id text check (char_length(image_file_id) <= 100),
  is_hidden boolean not null default false,
  is_pinned boolean not null default false
);

-- รายชื่ออีเมลผู้ดูแล: เพิ่มจาก SQL Editor เท่านั้น
create table if not exists public.admins (email text primary key);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- security definer อ่าน whitelist โดยไม่เปิดให้ frontend อ่านตาราง admins
-- ตั้ง search_path ชัดเจน ป้องกันการแทนที่ object และเทียบ email แบบไม่สนตัวพิมพ์
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- จำกัดสิทธิ์ CRUD และเปิด Row Level Security
alter table public.wishes enable row level security;
revoke all on public.wishes from anon, authenticated;
grant select, insert on public.wishes to anon;
grant select, insert, update, delete on public.wishes to authenticated;

-- แขกเพิ่มคำอวยพรได้ แต่ห้ามสั่งซ่อนหรือปักหมุดขณะเพิ่ม
drop policy if exists "guests_insert_wishes" on public.wishes;
create policy "guests_insert_wishes" on public.wishes for insert to anon, authenticated
  with check (is_hidden = false and is_pinned = false);

-- หน้าแขกและจอใช้งานด้วย anon จึงอ่านได้เฉพาะข้อความที่เปิดแสดง
drop policy if exists "public_reads_visible_wishes" on public.wishes;
create policy "public_reads_visible_wishes" on public.wishes for select to anon
  using (is_hidden = false);

-- แอดมินอ่าน รวมถึงแก้ไขและลบข้อความที่ซ่อนได้ทั้งหมด
drop policy if exists "admins_read_all_wishes" on public.wishes;
create policy "admins_read_all_wishes" on public.wishes for select to authenticated
  using (public.is_admin());
drop policy if exists "admins_update_wishes" on public.wishes;
create policy "admins_update_wishes" on public.wishes for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins_delete_wishes" on public.wishes;
create policy "admins_delete_wishes" on public.wishes for delete to authenticated
  using (public.is_admin());
-- ไม่มี UPDATE หรือ DELETE policy สำหรับ anon และไม่มี policy ของตาราง admins

-- เรียงข้อความใหม่และปักหมุดได้รวดเร็ว
create index if not exists wishes_created_at_desc_idx on public.wishes (created_at desc);
create index if not exists wishes_display_idx on public.wishes (is_pinned desc, created_at desc, id desc) where is_hidden = false;

-- เปิด Postgres Changes โดยตรวจสมาชิก publication เพื่อให้รันซ้ำได้
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'wishes'
  ) then
    alter publication supabase_realtime add table public.wishes;
  end if;
end;
$$;

-- ตั้งค่าวันจัดงาน: มีได้เพียงหนึ่งแถว และเก็บ date โดยไม่มี timezone
create table if not exists public.wedding_settings (
  id smallint primary key default 1 check (id = 1),
  wedding_date date check (wedding_date between date '0001-01-01' and date '9999-12-31')
);
insert into public.wedding_settings (id, wedding_date) values (1, null)
  on conflict (id) do nothing;

-- ทุกคนอ่านวันที่ได้ แต่เฉพาะผู้ดูแลแก้คอลัมน์วันที่ได้
alter table public.wedding_settings enable row level security;
revoke all on public.wedding_settings from anon, authenticated;
grant select on public.wedding_settings to anon, authenticated;
grant update (wedding_date) on public.wedding_settings to authenticated;
drop policy if exists "public_reads_wedding_settings" on public.wedding_settings;
create policy "public_reads_wedding_settings" on public.wedding_settings
  for select to anon, authenticated using (true);
drop policy if exists "admins_update_wedding_settings" on public.wedding_settings;
create policy "admins_update_wedding_settings" on public.wedding_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ให้จอในงานได้รับวันที่ใหม่ทันทีเมื่อแอดมินบันทึก
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'wedding_settings'
  ) then
    alter publication supabase_realtime add table public.wedding_settings;
  end if;
end;
$$;

-- เพิ่มอีเมลนี้หลังสร้าง Auth user ใน Dashboard แล้ว (เปลี่ยนเป็นอีเมลจริง)
-- insert into public.admins (email) values ('your-admin@example.com') on conflict (email) do nothing;
commit;
