import { Suspense } from "react";
import { getTodayMoods, getLast7DaysMoods } from "@/actions/mood";
import { getCoupleInfo } from "@/actions/couple";
import { getSession } from "@/actions/auth";
import { MoodPicker } from "@/components/mood/MoodPicker";
import { MoodChart } from "@/components/mood/MoodChart";

const MOOD_EMOJI: Record<number, string> = {
  1: "😔", 2: "😕", 3: "😐", 4: "😊", 5: "🤩",
};

// ─── PARTNER MOOD ─────────────────────────────────────────────────────────────

async function PartnerMoodSection({ partnerName }: { partnerName: string }) {
  const { partner: partnerMood } = await getTodayMoods();
  return (
    <div className={`rounded-2xl p-4 border ${
      partnerMood ? "bg-white border-stone-100" : "bg-stone-50 border-stone-100"
    }`}>
      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">
        {partnerName.split(" ")[0]} Hari Ini
      </p>
      {partnerMood ? (
        <div className="flex items-center gap-3">
          <span className="text-3xl">{partnerMood.emoji}</span>
          <div>
            <p className="font-semibold text-stone-800 text-sm">
              {MOOD_EMOJI[partnerMood.moodScore]} Mood {partnerMood.moodScore}/5
            </p>
            {partnerMood.note && (
              <p className="text-xs text-stone-400 mt-0.5 italic">
                &ldquo;{partnerMood.note}&rdquo;
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-stone-400 italic">
          {partnerName.split(" ")[0]} belum check-in hari ini
        </p>
      )}
    </div>
  );
}

// ─── MY MOOD PICKER ───────────────────────────────────────────────────────────

async function MyMoodSection() {
  const { mine } = await getTodayMoods();
  return <MoodPicker existing={mine} />;
}

// ─── CHART ────────────────────────────────────────────────────────────────────

async function ChartSection({
  userId,
  partnerId,
  myName,
  partnerName,
}: {
  userId:       string;
  partnerId?:   string;
  myName:       string;
  partnerName?: string;
}) {
  const history = await getLast7DaysMoods();
  if (history.length === 0) return null;
  return (
    <MoodChart
      checkins={history}
      myUserId={userId}
      partnerId={partnerId}
      myName={myName}
      partnerName={partnerName}
    />
  );
}

// ─── SKELETONS ────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-4 animate-pulse space-y-3">
      <div className="h-3 bg-stone-100 rounded w-1/3" />
      <div className="h-10 bg-stone-100 rounded w-full" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-4 animate-pulse space-y-3">
      <div className="h-3 bg-stone-100 rounded w-1/4" />
      <div className="flex gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 space-y-1">
            <div className="h-8 bg-stone-100 rounded-lg" />
            <div className="h-6 bg-stone-50 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default async function MoodPage() {
  const [session, coupleInfo] = await Promise.all([
    getSession(),
    getCoupleInfo(),
  ]);

  if (!session.ok) return null;

  const partner = coupleInfo?.members.find((m) => m.id !== session.userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Mood Check-in</h1>
        <p className="text-sm text-stone-400 mt-1">Bagikan perasaanmu hari ini</p>
      </div>

      {/* Partner mood — lazy */}
      {partner && (
        <Suspense fallback={<CardSkeleton />}>
          <PartnerMoodSection partnerName={partner.name} />
        </Suspense>
      )}

      {/* My mood picker — lazy */}
      <Suspense fallback={<CardSkeleton />}>
        <MyMoodSection />
      </Suspense>

      {/* Chart — lazy, paling berat */}
      <Suspense fallback={<ChartSkeleton />}>
        <ChartSection
          userId={session.userId}
          partnerId={partner?.id}
          myName={session.name}
          partnerName={partner?.name}
        />
      </Suspense>
    </div>
  );
}