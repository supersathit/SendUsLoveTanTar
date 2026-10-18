export function isValidWeddingDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '0001-01-01') return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function formatWeddingDate(value: string | null): string {
  if (!value || !isValidWeddingDate(value)) return '';
  // เก็บเป็นวันตามปฏิทิน ไม่เลื่อนวันตาม timezone ของเครื่องที่เปิดเว็บ
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'long', timeZone: 'UTC' })
    .format(new Date(`${value}T00:00:00Z`));
}
