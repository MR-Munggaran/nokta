import { getSpecialDates } from "@/actions/dates";
import { getDaysUntil } from "@/lib/dateUtils";
import { CountdownCard } from "@/components/dates/CountdownCard";
import { DateForm } from "@/components/dates/DateForm";
import { CalendarHeart } from "lucide-react";

export default async function DatesPage() {
  const dates = await getSpecialDates();

  // Sort by days until (ascending) — yang paling dekat di atas
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Tanggal Spesial</h1>
        <p className="text-sm text-stone-400 mt-1">
          {dates.length} momen tersimpan
        </p>
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
          {/* Nearest — featured */}
          {nearest && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">
                Paling Dekat
              </p>
              <CountdownCard item={nearest} />
            </div>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest px-1">
                Berikutnya
              </p>
              {rest.map((item) => (
                <CountdownCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}

      <DateForm />
    </>
  );
}