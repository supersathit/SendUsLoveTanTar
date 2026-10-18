-- เพิ่มการตั้งค่าวันจัดงานในโปรเจกต์ที่ติดตั้ง schema เดิมแล้ว
-- รันทั้งไฟล์ใน SQL Editor ได้ โดยไม่แก้ไขหรือลบคำอวยพร
begin;

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

commit;
