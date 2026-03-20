/**
 * Hitung berapa hari lagi sampai tanggal tertentu.
 * Kalau recurring, otomatis hitung ke tahun ini atau tahun depan.
 */
export function getDaysUntil(dateStr: string, recurringYearly: boolean): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);

  if (recurringYearly) {
    target.setFullYear(today.getFullYear());
    if (target < today) {
      target.setFullYear(today.getFullYear() + 1);
    }
  }

  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}