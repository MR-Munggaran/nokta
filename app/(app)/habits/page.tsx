import { getHabits } from "@/actions/habits";
import { getCoupleInfo } from "@/actions/couple";
import { getSession } from "@/actions/auth";
import { HabitCard } from "@/components/habits/HabitCard";
import { HabitForm } from "@/components/habits/HabitForm";
import { Activity } from "lucide-react";

export default async function HabitsPage() {
  const [habits, session, coupleInfo] = await Promise.all([
    getHabits(),
    getSession(),
    getCoupleInfo(),
  ]);

  if (!session.ok) return null;

  const partner = coupleInfo?.members.find((m) => m.id !== session.userId);

  // Hitung berapa habit sudah selesai hari ini
  const today        = new Date().toISOString().split("T")[0];
  const doneToday    = habits.filter((h) =>
    h.logs.some((l) => l.userId === session.userId && l.date === today)
  ).length;

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Habit Tracker</h1>
        <p className="text-sm text-stone-400 mt-1">
          {doneToday} dari {habits.length} selesai hari ini
        </p>
      </div>

      {/* Progress hari ini */}
      {habits.length > 0 && (
        <div className="mb-6">
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${habits.length ? (doneToday / habits.length) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-stone-400 mt-1.5 text-right">
            {Math.round(habits.length ? (doneToday / habits.length) * 100 : 0)}% hari ini
          </p>
        </div>
      )}

      {/* Empty state */}
      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-4">
            <Activity className="w-9 h-9 text-emerald-400" />
          </div>
          <h2 className="font-semibold text-lg text-stone-700 mb-1">Belum ada habit</h2>
          <p className="text-sm text-stone-400 max-w-[220px] leading-relaxed">
            Mulai bangun kebiasaan baik bersama pasanganmu
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              currentUserId={session.userId}
              partnerId={partner?.id}
              partnerName={partner?.name.split(" ")[0]}
              myName={session.name.split(" ")[0]}
            />
          ))}
        </div>
      )}

      <HabitForm />
    </>
  );
}