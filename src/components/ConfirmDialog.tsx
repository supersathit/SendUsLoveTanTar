import { useEffect, useRef } from 'react';

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel, busy = false }: {
  open: boolean; title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    else if (!open && dialog?.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className="confirm-dialog" onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }} aria-labelledby="dialog-title">
    <h2 id="dialog-title">{title}</h2><p>{message}</p><div className="dialog-actions"><button className="button-secondary" type="button" onClick={onCancel} disabled={busy}>ยกเลิก</button><button className="button-primary" type="button" onClick={onConfirm} disabled={busy}>{busy ? 'กำลังดำเนินการ...' : confirmLabel}</button></div>
  </dialog>;
}
