import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

test('SQL รันซ้ำได้ และ RLS จำกัดสิทธิ์แขก ผู้ใช้ทั่วไป และผู้ดูแลจริงใน PostgreSQL', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      grant usage on schema auth, public to anon, authenticated;
      create function auth.jwt() returns jsonb language sql stable as $$
        select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
      $$;
      create publication supabase_realtime;
    `);
    const schema = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
    await db.exec(schema);
    await db.exec(schema);
    await db.exec(`
      insert into public.admins values ('ADMIN@example.com');
      insert into public.wishes (guest_name, message, is_hidden) values ('ข้อความซ่อน', 'ให้ผู้ดูแลเห็นเท่านั้น', true);
      set role anon;
    `);
    assert.equal((await db.query('select * from wishes')).rows.length, 0);
    assert.equal((await db.query('select wedding_date from wedding_settings')).rows.length, 1);
    await assert.rejects(() => db.exec("update wedding_settings set wedding_date = '2026-10-24' where id = 1"));
    await assert.rejects(() => db.exec('insert into wedding_settings (id) values (1)'));
    await assert.rejects(() => db.exec('delete from wedding_settings'));
    await db.exec("insert into wishes (guest_name, message) values ('แขก', 'ขอให้มีความสุข')");
    assert.equal((await db.query('select * from wishes')).rows.length, 1);
    await assert.rejects(() => db.exec("insert into wishes (guest_name, message, is_pinned) values ('แขก', 'ปักหมุดเอง', true)"));
    await assert.rejects(() => db.exec("insert into wishes (guest_name, message, is_hidden) values ('แขก', 'ซ่อนเอง', true)"));
    await assert.rejects(() => db.exec("insert into wishes (guest_name, message) values ('   ', 'คำอวยพร')"));
    await assert.rejects(() => db.exec("insert into wishes (guest_name, message) values ('แขก', repeat('ก', 501))"));
    await assert.rejects(() => db.exec("insert into wishes (guest_name, message, side) values ('แขก', 'คำอวยพร', 'invalid')"));
    await assert.rejects(() => db.exec("update wishes set is_hidden = true"));
    await assert.rejects(() => db.exec('delete from wishes'));
    await assert.rejects(() => db.exec('select * from admins'));

    await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claims', '{"email":"guest@example.com"}', false);`);
    assert.equal((await db.query<{ is_admin: boolean }>('select public.is_admin()')).rows[0].is_admin, false);
    assert.equal((await db.query('select * from wishes')).rows.length, 0);
    assert.equal((await db.query("update wedding_settings set wedding_date = '2026-10-24' where id = 1 returning id")).rows.length, 0);
    await assert.rejects(() => db.exec('insert into wedding_settings (id) values (1)'));
    await assert.rejects(() => db.exec('delete from wedding_settings'));
    assert.equal((await db.query('update wishes set is_hidden = true returning id')).rows.length, 0);
    assert.equal((await db.query('delete from wishes returning id')).rows.length, 0);
    await db.exec("insert into wishes (guest_name, message) values ('ผู้ใช้ล็อกอินทั่วไป', 'ส่งคำอวยพรได้')");
    await assert.rejects(() => db.exec("insert into admins values ('guest@example.com')"));

    await db.exec(`select set_config('request.jwt.claims', '{"email":"admin@example.com"}', false);`);
    assert.equal((await db.query<{ is_admin: boolean }>('select public.is_admin()')).rows[0].is_admin, true);
    assert.equal((await db.query('select * from wishes')).rows.length, 3);
    assert.equal((await db.query("update wedding_settings set wedding_date = '2026-10-24' where id = 1 returning id")).rows.length, 1);
    await assert.rejects(() => db.exec("update wedding_settings set id = 2"));
    await assert.rejects(() => db.exec("update wedding_settings set wedding_date = '2026-02-29'"));
    assert.equal((await db.query("update wishes set is_hidden = false, is_pinned = true where guest_name = 'ข้อความซ่อน' returning id")).rows.length, 1);
    assert.equal((await db.query("delete from wishes where guest_name = 'ข้อความซ่อน' returning id")).rows.length, 1);
    await assert.rejects(() => db.exec('select * from admins'));
    await db.exec('reset role');
    const migration = readFileSync(new URL('../supabase/migrations/20261018_wedding_settings.sql', import.meta.url), 'utf8');
    await db.exec(migration);
    await db.exec(migration);
    assert.equal((await db.query<{ wedding_date: string }>('select wedding_date::text from wedding_settings where id = 1')).rows[0].wedding_date, '2026-10-24');
    assert.equal((await db.query('select * from wedding_settings')).rows.length, 1);
    assert.equal((await db.query("select * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'wedding_settings'")).rows.length, 1);
    assert.equal((await db.query("select * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'wishes'")).rows.length, 1);
  } finally { await db.close(); }
});
