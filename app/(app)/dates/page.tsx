import { getSpecialDates } from "@/actions/dates";
import { getDaysUntil } from "@/lib/dateUtils";
import { CountdownCard } from "@/components/dates/CountdownCard";
import { DateForm } from "@/components/dates/DateForm";
import { CalendarHeart } from "lucide-react";

export default async function DatesPage() {
  const dates = await getSpecialDates();

  const sorted = [...dates].sort((a, b) => {
    const dA = getDaysUntil(a.date, a.recurringYearly);
    const dB = getDaysUntil(b.date, b.recurringYearly);
    return dA - dB;
  });

  const nearest = sorted[0];
  const rest    = sorted.slice(1);

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Tanggal Spesial</h1>
          <p className="text-sm text-stone-400 mt-1">
            {dates.length} momen tersimpan
          </p>
        </div>
        {/* Tombol tambah — desktop (mobile pakai FAB) */}
        <DateForm desktopTrigger />
      </div>

      {dates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center mb-4">
            <CalendarHeart className="w-9 h-9 text-rose-400" />
          </div>
          <h2 className="font-semibold text-lg text-stone-700 mb-1">Belum ada tanggal spesial</h2>
          <p className="text-sm text-stone-400 max-w-[220px] leading-relaxed">
            Tambahkan anniversary, ulang tahun, atau hari penting kalian
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {nearest && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">
                Paling Dekat
              </p>
              {/* Featured — full width di semua ukuran */}
              <CountdownCard item={nearest} featured />
            </div>
          )}

          {rest.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">
                Berikutnya
              </p>
              {/* Desktop: 2 kolom, mobile: 1 kolom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rest.map((item) => (
                  <CountdownCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAB — mobile only */}
      <DateForm />
    </>
  );
}