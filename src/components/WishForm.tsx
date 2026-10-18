import { useEffect, useRef, useState, type FormEvent } from 'react';
import { publicSupabase } from '../lib/supabase';
import { uploadImage } from '../lib/upload';
import { sideLabels, type Side } from '../lib/types';
import { useCooldown } from '../hooks/useCooldown';
import { Icon } from './Icon';
import { ConfirmDialog } from './ConfirmDialog';

export function WishForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [side, setSide] = useState<Side | null>(null);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const submissionLock = useRef(false);
  const submissionId = useRef(crypto.randomUUID());
  const uploaded = useRef<{ file: File; id: string } | null>(null);
  const cooldown = useCooldown();
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function selectFile(next?: File) {
    if (!next) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type)) { setError('กรุณาเลือกรูปแบบ JPG, PNG หรือ WebP'); return; }
    if (next.size > 20 * 1024 * 1024) { setError('รูปมีขนาดใหญ่เกินไป กรุณาเลือกรูปไม่เกิน 20 MB'); return; }
    setFile(next); uploaded.current = null; setError('');
  }
  async function send(textOnly = false) {
    if (submissionLock.current) return;
    setError('');
    if (honeypot) return;
    if (!name.trim() || !message.trim()) { setError('กรุณากรอกชื่อและคำอวยพรก่อนส่งนะคะ'); return; }
    if (!cooldown.canSend()) { setError('รอสักครู่ก่อนส่งคำอวยพรอีกครั้งนะคะ'); return; }
    if (!publicSupabase) { setError('ระบบยังไม่พร้อมรับคำอวยพร กรุณาติดต่อผู้ดูแล'); return; }
    submissionLock.current = true; setBusy(true); setStatus('กำลังส่งคำอวยพร...');
    try {
      let imageId: string | null = null;
      if (file && !textOnly) {
        setStatus('กำลังอัปโหลดรูป...');
        try {
          if (uploaded.current?.file === file) imageId = uploaded.current.id;
          else { imageId = await uploadImage(file); uploaded.current = { file, id: imageId }; }
        } catch { setFallback(true); return; }
      }
      setStatus('กำลังส่งคำอวยพร...');
      const { error: insertError } = await publicSupabase.from('wishes').insert({
        id: submissionId.current, guest_name: name.trim(), message: message.trim(), side, image_file_id: imageId,
      }).abortSignal(AbortSignal.timeout(20000));
      // ถ้าเครือข่ายขาดหลัง DB บันทึกแล้ว การลองซ้ำใช้ id เดิม จึงไม่เพิ่มข้อความซ้ำ
      if (insertError && insertError.code !== '23505') throw insertError;
      cooldown.start(); onSuccess();
    } catch { setError('ส่งคำอวยพรไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้งนะคะ'); }
    finally { submissionLock.current = false; setBusy(false); setStatus(''); }
  }
  function submit(event: FormEvent) { event.preventDefault(); void send(); }
  return <>
    <form className="wish-form" onSubmit={submit}>
      <div className="field-group"><label htmlFor="guest-name">ชื่อของคุณ <span className="required">*</span></label><input id="guest-name" name="guest_name" autoComplete="name" maxLength={50} required value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อที่อยากให้บ่าวสาวจดจำ" disabled={busy} /></div>
      <fieldset className="field-group"><legend>คุณเป็นแขกฝ่ายไหน <span className="optional">(ไม่บังคับ)</span></legend><div className="chips">{(Object.keys(sideLabels) as Side[]).map(value => <button type="button" key={value} aria-pressed={side === value} className={`chip ${side === value ? 'selected' : ''}`} disabled={busy} onClick={() => setSide(side === value ? null : value)}>{side === value && <Icon name="check" size={14} />}{sideLabels[value]}</button>)}</div></fieldset>
      <div className="field-group"><div className="label-row"><label htmlFor="wish-message">คำอวยพรถึงบ่าวสาว <span className="required">*</span></label><span className="counter" aria-live="off">{message.length} / 500</span></div><textarea id="wish-message" name="message" rows={5} required maxLength={500} value={message} disabled={busy} onChange={e => setMessage(e.target.value)} placeholder="เขียนความรู้สึกดี ๆ หรือเล่าความทรงจำที่อยากแบ่งปัน..." /></div>
      <div className="field-group"><label htmlFor="wish-photo">แนบความทรงจำดี ๆ <span className="optional">(ไม่บังคับ)</span></label><input ref={fileInput} id="wish-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} className="sr-only" onChange={e => selectFile(e.target.files?.[0])} />
        {preview ? <div className="photo-preview"><img src={preview} alt="รูปที่เลือกสำหรับคำอวยพร" /><button type="button" className="remove-photo" disabled={busy} onClick={() => { setFile(null); uploaded.current = null; if (fileInput.current) fileInput.current.value = ''; }} aria-label="ลบรูปที่เลือก"><Icon name="close" size={18} /></button></div>
          : <button type="button" className="upload-zone" disabled={busy} onClick={() => fileInput.current?.click()}><span className="upload-icon"><Icon name="image" size={23} /></span><strong>แตะเพื่อเลือกรูปภาพ</strong><span>JPG, PNG หรือ WebP · ระบบย่อรูปให้ก่อนส่ง</span></button>}
      </div>
      <div className="honeypot" aria-hidden="true"><label htmlFor="website">เว็บไซต์</label><input id="website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} /></div>
      {error && <p className="error-message" role="alert">{error}</p>}
      <button className="button-primary send-button" type="submit" disabled={busy || cooldown.remaining > 0 || !publicSupabase}><Icon name="heart" size={18} />{busy ? status : cooldown.remaining > 0 ? `ส่งอีกครั้งได้ใน ${cooldown.remaining} วินาที` : 'ส่งคำอวยพรด้วยรัก'}{!busy && <Icon name="arrow" size={18} />}</button>
      <p className="form-note" role="status">{!publicSupabase ? 'ระบบยังไม่เปิดรับคำอวยพร กรุณาติดต่อผู้ดูแล' : 'คำอวยพรและรูปของคุณจะแสดงบนจอในงาน'}</p>
    </form>
    <ConfirmDialog open={fallback} title="อัปโหลดรูปไม่สำเร็จ" message="ส่งเฉพาะข้อความแทนไหม? คำอวยพรของคุณยังส่งได้ตามปกติค่ะ" confirmLabel="ส่งเฉพาะข้อความ" onCancel={() => { setFallback(false); setError('เลือกรูปใหม่หรือลองส่งอีกครั้งได้เลยนะคะ'); }} onConfirm={() => { setFallback(false); void send(true); }} />
  </>;
}
