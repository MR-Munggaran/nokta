"use client";

import type { MoodCheckin } from "@/actions/mood";

const MOOD_EMOJI: Record<number, string> = {
  1: "😭", // sedih banget
  2: "😔",
  3: "😕",
  4: "😐",
  5: "😊",
  6: "🥰", // sayang-sayang
  7: "🤣", // ngakak
  8: "🤩",
};

const MOOD_COLOR: Record<number, string> = {
  1: "bg-rose-300",
  2: "bg-red-200",
  3: "bg-orange-200",
  4: "bg-yellow-200",
  5: "bg-emerald-200",
  6: "bg-pink-200",     // sayang
  7: "bg-sky-200",      // ngakak
  8: "bg-indigo-200",
};
interface Props {
  checkins:     MoodCheckin[];
  myUserId:     string;
  partnerId?:   string;
  myName:       string;
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

export function MoodChart({
  checkins,
  myUserId,
  partnerId,
  myName,
  partnerName,
}: Props) {
  const days = getLast7Days();

  const myCheckins = Object.fromEntries(
    checkins.filter((c) => c.userId === myUserId).map((c) => [c.date, c])
  );
  const partnerCheckins = partnerId
    ? Object.fromEntries(
        checkins.filter((c) => c.userId === partnerId).map((c) => [c.date, c])
      )
    : {};

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 sm:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <p className="font-semibold text-stone-800 text-sm sm:text-base">
        7 Hari Terakhir
      </p>

      {/* Legend */}
      <div className="flex gap-4 text-xs sm:text-sm text-stone-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-indigo-400 inline-block" />
          {myName.split(" ")[0]}
        </span>
        {partnerName && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-300 inline-block" />
            {partnerName.split(" ")[0]}
          </span>
        )}
      </div>

      {/* Chart
          Bar my mood  : h-8  mobile → h-12 sm → h-16 md
          Bar partner  : h-6  mobile → h-9  sm → h-12 md
          Gap antar col: gap-1.5 mobile → gap-2 sm */}
      <div className="flex gap-1.5 sm:gap-2">
        {days.map((date) => {
          const mine    = myCheckins[date];
          const partner = partnerCheckins[date];
          const isToday = date === new Date().toISOString().split("T")[0];

          return (
            <div
              key={date}
              className="flex-1 flex flex-col items-center gap-1.5"
            >
              {/* Bar wrapper */}
              <div className="w-full flex flex-col items-center gap-1">
                {/* My bar */}
                {mine ? (
                  <div
                    className={`w-full h-8 sm:h-12 md:h-16 rounded-lg sm:rounded-xl ${MOOD_COLOR[mine.moodScore]} flex items-center justify-center transition-all`}
                  >
                    <span className="text-sm sm:text-xl md:text-2xl">
                      {MOOD_EMOJI[mine.moodScore]}
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-8 sm:h-12 md:h-16 rounded-lg sm:rounded-xl bg-stone-100" />
                )}

                {/* Partner bar */}
                {partnerId && (
                  partner ? (
                    <div
                      className={`w-full h-6 sm:h-9 md:h-12 rounded-lg sm:rounded-xl opacity-60 ${MOOD_COLOR[partner.moodScore]} flex items-center justify-center transition-all`}
                    >
                      <span className="text-xs sm:text-base md:text-lg">
                        {MOOD_EMOJI[partner.moodScore]}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-6 sm:h-9 md:h-12 rounded-lg sm:rounded-xl bg-stone-50" />
                  )
                )}
              </div>

              {/* Day label */}
              <span
                className={`text-[10px] sm:text-xs font-medium ${
                  isToday ? "text-indigo-500" : "text-stone-400"
                }`}
              >
                {isToday ? "Hari ini" : getDayLabel(date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}