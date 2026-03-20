"use client";

import type { MoodCheckin } from "@/actions/mood";

const MOOD_EMOJI: Record<number, string> = {
  1: "😔",
  2: "😕",
  3: "😐",
  4: "😊",
  5: "🤩",
};

const MOOD_COLOR: Record<number, string> = {
  1: "bg-red-200",
  2: "bg-orange-200",
  3: "bg-yellow-200",
  4: "bg-emerald-200",
  5: "bg-indigo-200",
};

interface Props {
  checkins:    MoodCheckin[];
  myUserId:    string;
  partnerId?:  string;
  myName:      string;
  partnerName?: string;
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { weekday: "short" });
}

export function MoodChart({ checkins, myUserId, partnerId, myName, partnerName }: Props) {
  const days = getLast7Days();

  const myCheckins      = Object.fromEntries(
    checkins.filter((c) => c.userId === myUserId).map((c) => [c.date, c])
  );
  const partnerCheckins = partnerId
    ? Object.fromEntries(
        checkins.filter((c) => c.userId === partnerId).map((c) => [c.date, c])
      )
    : {};

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-4">
      <p className="font-semibold text-stone-800 text-sm">7 Hari Terakhir</p>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-stone-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
          {myName.split(" ")[0]}
        </span>
        {partnerName && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-300 inline-block" />
            {partnerName.split(" ")[0]}
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="flex gap-1.5">
        {days.map((date) => {
          const mine    = myCheckins[date];
          const partner = partnerCheckins[date];
          const isToday = date === new Date().toISOString().split("T")[0];

          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1.5">
              {/* My bar */}
              <div className="w-full flex flex-col items-center gap-1">
                {mine ? (
                  <div className={`w-full h-8 rounded-lg ${MOOD_COLOR[mine.moodScore]} flex items-center justify-center`}>
                    <span className="text-sm">{MOOD_EMOJI[mine.moodScore]}</span>
                  </div>
                ) : (
                  <div className="w-full h-8 rounded-lg bg-stone-100" />
                )}

                {/* Partner bar */}
                {partnerId && (
                  partner ? (
                    <div className={`w-full h-6 rounded-lg opacity-60 ${MOOD_COLOR[partner.moodScore]} flex items-center justify-center`}>
                      <span className="text-xs">{MOOD_EMOJI[partner.moodScore]}</span>
                    </div>
                  ) : (
                    <div className="w-full h-6 rounded-lg bg-stone-50" />
                  )
                )}
              </div>

              {/* Day label */}
              <span className={`text-[10px] font-medium ${
                isToday ? "text-indigo-500" : "text-stone-400"
              }`}>
                {isToday ? "Hari ini" : getDayLabel(date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}