import { useRef, useState, type FormEvent } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { wedding } from '../config/wedding';
import { useAuth } from '../hooks/useAuth';
import { useWishesRealtime } from '../hooks/useWishesRealtime';
import { adminSupabase } from '../lib/supabase';
import { sideLabels, type ControlEvent, type Wish } from '../lib/types';
import { downloadBlob, wishesCsv, writeUrl } from '../lib/utils';
import { driveLink } from '../lib/drive';
import { WeddingLogo } from '../components/Decorations';
import { DriveImage } from '../components/DriveImage';
import { ConnectionDot } from '../components/ConnectionDot';
import { Icon } from '../components/Icon';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useQRColors } from '../components/QRBadge';
import { FloatingHearts } from '../components/FloatingHearts';
import { WeddingDateSettings } from '../components/WeddingDateSettings';

type Filter = 'all' | 'visible' | 'hidden' | 'pinned' | 'photos';
const filters: Record<Filter, string> = { all: 'ทั้งหมด', visible: 'แสดงอยู่', hidden: 'ซ่อนอยู่', pinned: 'ปักหมุด', photos: 'มีรูป' };

export function AdminPage() {
  const auth = useAuth();
  const data = useWishesRealtime('admin', auth.isAdmin && !auth.loading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Wish | null>(null);
  const qr = useRef<HTMLCanvasElement>(null);
  const mutationLock = useRef(false);
  const qrColors = useQRColors();
  async function login(event: FormEvent) {
    event.preventDefault(); setLoginBusy(true); setLocalError('');
    const error = await auth.signIn(email, password); setPassword(''); setLocalError(error); setLoginBusy(false);
  }
  async function logout() { setLocalError(await auth.signOut()); }
  async function mutate(wish: Wish, action: 'visibility' | 'pin' | 'delete') {
    if (!adminSupabase || mutationLock.current) return;
    mutationLock.current = true; setBusyId(wish.id); setLocalError(''); setNotice('');
    try {
      let event: ControlEvent;
      if (action === 'delete') {
        const result = await adminSupabase.from('wishes').delete().eq('id', wish.id).select('id');
        if (result.error || result.data.length !== 1) throw result.error || new Error('ไม่พบข้อความ');
        event = 'delete'; setDeleting(null);
      } else {
        const changes = action === 'pin' ? { is_pinned: !wish.is_pinned } : { is_hidden: !wish.is_hidden };
        const result = await adminSupabase.from('wishes').update(changes).eq('id', wish.id).select('id');
        if (result.error || result.data.length !== 1) throw result.error || new Error('ไม่มีสิทธิ์');
        event = action === 'pin' ? 'pin' : wish.is_hidden ? 'unhide' : 'hide';
      }
      const sent = await data.broadcast(event, wish.id);
      await data.refresh();
      setNotice(sent ? 'บันทึกแล้ว และส่งการเปลี่ยนแปลงไปยังจอในงานแล้ว' : 'บันทึกแล้ว จอในงานจะปรับข้อมูลภายใน 30 วินาที');
    } catch { setLocalError('จัดการข้อความไม่สำเร็จ กรุณาตรวจสอบสิทธิ์และลองอีกครั้ง'); }
    finally { mutationLock.current = false; setBusyId(null); }
  }
  function downloadQR() {
    setLocalError('');
    try {
      if (!qr.current) throw new Error('ไม่พบ QR');
      qr.current.toBlob(blob => {
        if (blob) downloadBlob(blob, 'คิวอาร์โค้ด-ร่วมอวยพร.png');
        else setLocalError('ดาวน์โหลดคิวอาร์โค้ดไม่สำเร็จ กรุณาลองอีกครั้ง');
      }, 'image/png');
    } catch { setLocalError('ดาวน์โหลดคิวอาร์โค้ดไม่สำเร็จ กรุณาลองอีกครั้ง'); }
  }
  function exportCSV() {
    try { downloadBlob(new Blob([wishesCsv(data.wishes)], { type: 'text/csv;charset=utf-8;' }), 'คำอวยพรงานแต่ง.csv'); }
    catch { setLocalError('ส่งออกไฟล์ไม่สำเร็จ กรุณาลองอีกครั้ง'); }
  }
  if (auth.loading) return <main className="login-page"><FloatingHearts /><p className="loading-message" role="status">กำลังตรวจสอบสิทธิ์...</p></main>;
  if (!auth.isAdmin) return <main className="login-page"><FloatingHearts /><section className="login-panel"><WeddingLogo /><span className="login-icon"><Icon name="lock" size={24} /></span><h1>พื้นที่ของผู้ดูแล</h1><p>ดูแลทุกคำอวยพรในวันสำคัญของเรา</p>{auth.session ? <><p className="error-message" role="alert">{auth.error || 'ไม่มีสิทธิ์เข้าถึง'}</p>{localError && <p className="error-message" role="alert">{localError}</p>}<button className="button-primary" onClick={() => { void logout(); }}>ออกจากระบบ</button></> : <form onSubmit={login}><div className="field-group"><label htmlFor="admin-email">อีเมล</label><input id="admin-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} disabled={loginBusy} placeholder="อีเมลผู้ดูแล" /></div><div className="field-group"><label htmlFor="admin-password">รหัสผ่าน</label><input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} disabled={loginBusy} placeholder="รหัสผ่านของคุณ" /></div>{(localError || auth.error) && <p className="error-message" role="alert">{localError || auth.error}</p>}<button className="button-primary" disabled={loginBusy || !adminSupabase}>{loginBusy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}<Icon name="arrow" size={18} /></button>{!adminSupabase && <p className="form-note">กรุณาตั้งค่าการเชื่อมต่อ Supabase ก่อนเข้าสู่ระบบ</p>}</form>}<a className="text-link" href="#/write">กลับไปหน้าเขียนคำอวยพร</a></section></main>;
  const term = search.trim().toLocaleLowerCase('th-TH');
  const visible = data.wishes.filter(w => {
    if (term && !`${w.guest_name} ${w.message}`.toLocaleLowerCase('th-TH').includes(term)) return false;
    return filter === 'all' || (filter === 'visible' && !w.is_hidden) || (filter === 'hidden' && w.is_hidden) || (filter === 'pinned' && w.is_pinned) || (filter === 'photos' && Boolean(w.image_file_id));
  });
  const stats = [
    { label: 'คำอวยพรทั้งหมด', value: data.total, icon: 'heart' as const },
    { label: 'ฝ่ายเจ้าสาว', value: data.wishes.filter(w => w.side === 'bride').length },
    { label: 'ฝ่ายเจ้าบ่าว', value: data.wishes.filter(w => w.side === 'groom').length },
    { label: 'ทั้งสองฝ่าย', value: data.wishes.filter(w => w.side === 'both').length },
    { label: 'ไม่ระบุฝ่าย', value: data.wishes.filter(w => !w.side).length },
    { label: 'คำอวยพรพร้อมรูป', value: data.wishes.filter(w => w.image_file_id).length, icon: 'image' as const },
  ];
  return <main className="admin-page"><FloatingHearts /><header className="admin-header"><a href="#/write" className="admin-brand"><WeddingLogo /><div><h1>จัดการคำอวยพร</h1><p>{wedding.title}</p></div></a><div className="admin-account"><ConnectionDot status={data.connection} /><span>{auth.session?.user.email}</span><button className="button-secondary" onClick={() => { void logout(); }}>ออกจากระบบ</button></div></header>
    <div className="admin-container"><div className="admin-heading"><div><p className="eyebrow">ทุกความรู้สึกดี ๆ อยู่ที่นี่</p><h2>คำอวยพรจากคนที่เรารัก</h2><p>จัดการข้อความที่แสดงบนจอ และเก็บความทรงจำของวันสำคัญ</p></div><div className="admin-tools"><button className="button-secondary" onClick={downloadQR}><Icon name="download" size={17} />ดาวน์โหลดคิวอาร์โค้ด</button><button className="button-secondary" onClick={exportCSV} disabled={data.loading || Boolean(data.error)}><Icon name="download" size={17} />ส่งออกไฟล์ CSV</button><a className="button-primary" href="#/display" target="_blank" rel="noopener noreferrer"><Icon name="external" size={17} />เปิดจอในงาน</a></div></div>
      <WeddingDateSettings />
      <div className="stats-grid">{stats.map(stat => <div className="stat-card" key={stat.label}><span>{stat.label}{stat.icon && <Icon name={stat.icon} size={18} />}</span><strong>{stat.value.toLocaleString('th-TH')}</strong><small>ข้อความ</small></div>)}</div>
      {(data.error || localError) && <p role="alert" className="error-message">{localError || data.error}</p>}{notice && <p role="status" className="success-message">{notice}</p>}
      <section className="admin-list-panel"><div className="admin-toolbar"><div className="search-field"><Icon name="search" size={18} /><input aria-label="ค้นหาตามชื่อหรือคำอวยพร" value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อหรือคำอวยพร..." /></div><div className="filter-chips">{(Object.keys(filters) as Filter[]).map(key => <button key={key} className={`chip ${filter === key ? 'selected' : ''}`} aria-pressed={filter === key} onClick={() => setFilter(key)}>{filters[key]}</button>)}</div><button className="text-link" onClick={() => { void data.refresh(); }}>โหลดใหม่</button></div>
        <div className="list-caption">แสดง {visible.length.toLocaleString('th-TH')} จาก {data.total.toLocaleString('th-TH')} ข้อความ</div>
        <div className="table-scroll"><table><thead><tr><th>แขกและเวลา</th><th>คำอวยพร</th><th>รูปภาพ</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>{visible.map(wish => <tr key={wish.id} className={wish.is_hidden ? 'hidden-row' : ''}>
          <td><strong className="table-name">{wish.guest_name}</strong><span className="table-side">{wish.side ? sideLabels[wish.side] : 'ไม่ระบุฝ่าย'}</span><time dateTime={wish.created_at}>{new Date(wish.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'short', timeStyle: 'short' })}</time></td>
          <td className="table-message">{wish.message}</td><td>{wish.image_file_id ? <a href={driveLink(wish.image_file_id)} target="_blank" rel="noopener noreferrer" aria-label={`เปิดรูปของ ${wish.guest_name} ใน Google Drive`} className="table-image"><DriveImage fileId={wish.image_file_id} alt={`รูปจาก ${wish.guest_name}`} /><span>เปิดรูป ↗</span></a> : <span className="muted">ไม่มีรูป</span>}</td>
          <td><span className={`state-badge ${wish.is_hidden ? 'hidden' : 'visible'}`}>{wish.is_hidden ? 'ซ่อนอยู่' : 'แสดงอยู่'}</span>{wish.is_pinned && <span className="table-pin"><Icon name="pin" size={12} />ปักหมุด</span>}</td>
          <td><div className="row-actions"><button disabled={busyId !== null} onClick={() => { void mutate(wish, 'visibility'); }}><Icon name="eye" size={15} />{wish.is_hidden ? 'แสดง' : 'ซ่อน'}</button><button disabled={busyId !== null} onClick={() => { void mutate(wish, 'pin'); }}><Icon name="pin" size={15} />{wish.is_pinned ? 'เลิกปักหมุด' : 'ปักหมุด'}</button><button disabled={busyId !== null} className="delete-action" onClick={() => setDeleting(wish)}><Icon name="trash" size={15} />ลบ</button></div>{busyId === wish.id && <small role="status">กำลังบันทึก...</small>}</td>
        </tr>)}</tbody></table></div>
        {!visible.length && <div className="admin-empty">{data.loading ? 'กำลังโหลดคำอวยพร...' : search || filter !== 'all' ? 'ไม่พบคำอวยพรที่ตรงกับการค้นหา' : 'ยังไม่มีคำอวยพร รอความรักจากแขกในงานค่ะ'}</div>}
      </section><footer className="admin-footer">{wedding.title} <span>·</span> ทุกคำอวยพร คือความทรงจำที่มีความหมาย</footer>
    </div>
    <div className="qr-download-canvas" aria-hidden="true">{qrColors.fg && <QRCodeCanvas ref={qr} value={writeUrl()} size={2048} level="H" marginSize={4} fgColor={qrColors.fg} bgColor={qrColors.bg} />}</div>
    <ConfirmDialog open={Boolean(deleting)} title="ลบคำอวยพรนี้?" message={`คำอวยพรของ ${deleting?.guest_name ?? ''} จะถูกลบถาวรและนำออกจากจอในงาน`} confirmLabel="ลบคำอวยพร" busy={busyId !== null} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) void mutate(deleting, 'delete'); }} />
  </main>;
}
