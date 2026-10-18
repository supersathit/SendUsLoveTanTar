import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useWeddingSettings } from '../hooks/useWeddingSettings';
import { formatWeddingDate, isValidWeddingDate } from '../lib/weddingDate';
import { Icon } from './Icon';

export function WeddingDateSettings() {
  const settings = useWeddingSettings();
  const [draft, setDraft] = useState(settings.weddingDate ?? '');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false);
  useEffect(() => { if (!dirty) setDraft(settings.weddingDate ?? ''); }, [settings.weddingDate, dirty]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setSaving(true); setError(''); setNotice('');
    try {
      await settings.saveDate(draft);
      setDirty(false); setNotice('บันทึกวันที่จัดงานแล้ว ทุกหน้าจะใช้วันที่นี้');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'บันทึกวันที่ไม่สำเร็จ กรุณาลองอีกครั้ง'); }
    finally { lock.current = false; setSaving(false); }
  }
  return <section className="wedding-settings-panel" aria-labelledby="wedding-settings-title">
    <div className="wedding-settings-intro"><h2 id="wedding-settings-title">วันที่จัดงาน</h2><p>กำหนดวันที่สำหรับหน้าเขียนคำอวยพรและจอในงาน</p></div>
    <form className="wedding-date-form" onSubmit={submit}>
      <div className="wedding-date-field"><label htmlFor="wedding-date">เลือกวันที่จัดงาน <span className="optional">(ปี ค.ศ.)</span></label><input id="wedding-date" type="date" min="0001-01-01" max="9999-12-31" required value={draft} disabled={settings.loading || saving} aria-describedby="wedding-date-preview" onChange={event => { setDraft(event.target.value); setDirty(true); setError(''); setNotice(''); }} /><p id="wedding-date-preview">{settings.loading ? 'กำลังโหลดวันที่จัดงาน...' : `แสดงบนเว็บ: ${formatWeddingDate(draft) || settings.dateLabel}`}</p></div>
      <button className="button-primary" type="submit" disabled={settings.loading || saving || !isValidWeddingDate(draft) || !dirty}><Icon name="check" size={18} />{saving ? 'กำลังบันทึก...' : 'บันทึกวันที่'}</button>
    </form>
    {(error || settings.error) && <div className="settings-feedback"><p className="error-message" role="alert">{error || settings.error}</p><button type="button" className="text-link" onClick={() => { void settings.refresh(); }}>โหลดวันที่อีกครั้ง</button></div>}
    {notice && <p className="success-message" role="status">{notice}</p>}
  </section>;
}
