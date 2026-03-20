"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleHabitLog, deleteHabit } from "@/actions/habits";
import { toast } from "sonner";
import { Check, Trash2, Flame } from "lucide-react";
import type { HabitWithLogs } from "@/actions/habits";

interface Props {
  habit:       HabitWithLogs;
  currentUserId: string;
  partnerId?:  string;
  partnerName?: string;
  myName:      string;
}

function getStreak(logs: HabitWithLogs["logs"], userId: string): number {
  const userLogs = logs
    .filter((l) => l.userId === userId)
    .map((l) => l.date)
    .sort()
    .reverse();

  if (userLogs.length === 0) return 0;

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    if (userLogs.includes(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

function isLoggedToday(logs: HabitWithLogs["logs"], userId: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return logs.some((l) => l.userId === userId && l.date === today);
}

export function HabitCard({ habit, currentUserId, partnerId, partnerName, myName }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const myLogged      = isLoggedToday(habit.logs, currentUserId);
  const partnerLogged = partnerId ? isLoggedToday(habit.logs, partnerId) : false;
  const myStreak      = getStreak(habit.logs, currentUserId);

  async function handleToggle() {
    setBusy(true);
    const result = await toggleHabitLog(habit.id);
    setBusy(false);
    if (!result.success) return toast.error(result.error);
    toast.success(result.data.logged ? "Selesai hari ini! 🔥" : "Dibatalkan");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Hapus habit "${habit.title}"?`)) return;
    setBusy(true);
    const result = await deleteHabit(habit.id);
    setBusy(false);
    if (!result.success) return toast.error(result.error);
    toast.success("Habit dihapus");
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{habit.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-stone-800">{habit.title}</p>
          <p className="text-xs text-stone-400 mt-0.5 capitalize">
            {habit.frequency === "daily" ? "Setiap hari" : "Setiap minggu"}
          </p>
        </div>
        {myStreak > 0 && (
          <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg flex-shrink-0">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-xs font-bold text-orange-500">{myStreak}</span>
          </div>
        )}
        <button
          onClick={handleDelete}
          disabled={busy}
          className="text-stone-300 hover:text-red-400 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Side by side completion */}
      <div className="grid grid-cols-2 gap-2">
        {/* My status */}
        <button
          onClick={handleToggle}
          disabled={busy}
          className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all disabled:opacity-50 ${
            myLogged
              ? "bg-emerald-50 border-emerald-200"
              : "bg-stone-50 border-stone-100 hover:border-stone-200"
          }`}
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            myLogged ? "bg-emerald-500 border-emerald-500" : "border-stone-300"
          }`}>
            {myLogged && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs font-semibold text-stone-700 truncate">{myName}</p>
            <p className={`text-[10px] ${myLogged ? "text-emerald-500" : "text-stone-400"}`}>
              {myLogged ? "Selesai ✓" : "Belum"}
            </p>
          </div>
        </button>

        {/* Partner status — read only */}
        <div className={`flex items-center gap-2 p-3 rounded-xl border-2 ${
          partnerLogged
            ? "bg-emerald-50 border-emerald-200"
            : "bg-stone-50 border-stone-100"
        }`}>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            partnerLogged ? "bg-emerald-500 border-emerald-500" : "border-stone-200"
          }`}>
            {partnerLogged && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs font-semibold text-stone-700 truncate">
              {partnerName ?? "Pasangan"}
            </p>
            <p className={`text-[10px] ${partnerLogged ? "text-emerald-500" : "text-stone-400"}`}>
              {partnerLogged ? "Selesai ✓" : "Belum"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}