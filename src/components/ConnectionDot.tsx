import type { ConnectionStatus } from '../lib/types';
const labels: Record<ConnectionStatus, string> = {
  connected: 'เชื่อมต่อแล้ว', connecting: 'กำลังเชื่อมต่อ', offline: 'กำลังเชื่อมต่อใหม่', unconfigured: 'ยังไม่ได้เชื่อมต่อระบบ',
};
export function ConnectionDot({ status }: { status: ConnectionStatus }) {
  return <div className={`connection-dot ${status}`} role="status"><i /><span>{labels[status]}</span></div>;
}
