"use client";

import type { MoodCheckin } from "@/actions/mood";

const MOOD_EMOJI: Record<number, string> = {
  1: "😭",
  2: "😔",
  3: "😕",
  4: "😐",
  5: "😊",
  6: "🥰",
  7: "🤣",
  8: "🤩",
};

const MOOD_COLOR: Record<number, string> = {
  1: "bg-rose-300",
  2: "bg-red-200",
  3: "bg-orange-200",
  4: "bg-yellow-200",
  5: "bg-emerald-200",
  6: "bg-pink-200",
  7: "bg-sky-200",
  8: "bg-indigo-200",
};

interface Props {
  checkins: MoodCheckin[];
  myUserId: string;
  partnerId?: string;
  myName: string;
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
    <div className="bg-white rounded-2xl border border-stone-100 p-5 sm:p-6 lg:p-8 space-y-5 max-w-3xl lg:max-w-4xl mx-auto">
      <p className="font-semibold text-stone-800 text-sm sm:text-base lg:text-lg">
        7 Hari Terakhir
      </p>

      <div className="flex gap-4 text-xs sm:text-sm text-stone-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
          {myName.split(" ")[0]}
        </span>
        {partnerName && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-300 inline-block" />
            {partnerName.split(" ")[0]}
          </span>
        )}
      </div>

      <div className="flex gap-2 lg:gap-3 px-1 sm:px-2">
        {days.map((date) => {
          const mine = myCheckins[date];
          const partner = partnerCheckins[date];
          const isToday = date === new Date().toISOString().split("T")[0];

          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center gap-1">
                {mine ? (
                  <div
                    title={`${date} - mood ${mine.moodScore}`}
                    className={`w-full h-10 sm:h-14 md:h-20 lg:h-24 rounded-xl ${MOOD_COLOR[mine.moodScore]} flex items-center justify-center transition-all duration-300 hover:scale-105`}
                  >
                    <span className="text-sm sm:text-xl md:text-2xl lg:text-3xl">
                      {MOOD_EMOJI[mine.moodScore]}
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-10 sm:h-14 md:h-20 lg:h-24 rounded-xl bg-stone-100" />
                )}

                {partnerId && (
                  partner ? (
                    <div
                      className={`w-full h-8 sm:h-10 md:h-14 lg:h-16 rounded-xl opacity-60 ${MOOD_COLOR[partner.moodScore]} flex items-center justify-center`}
                    >
                      <span className="text-xs sm:text-base md:text-lg">
                        {MOOD_EMOJI[partner.moodScore]}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-8 sm:h-10 md:h-14 lg:h-16 rounded-xl bg-stone-50" />
                  )
                )}
              </div>

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
