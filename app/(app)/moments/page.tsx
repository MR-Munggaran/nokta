import { getMoments } from "@/actions/moments";
import { MomentCard } from "@/components/moments/MomentCard";
import { MomentForm } from "@/components/moments/MomentForm";
import { ImageOff } from "lucide-react";

export default async function MomentsPage() {
  const moments = await getMoments();

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="pt-2 flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Galeri</p>
          <h1 className="text-2xl font-bold text-stone-800 mt-0.5">Momen Kita 💕</h1>
          <p className="text-xs text-stone-400 mt-1">
            {moments.length > 0
              ? `${moments.length} kenangan tersimpan`
              : "Belum ada momen — yuk abadikan yang pertama!"}
          </p>
        </div>
        <MomentForm desktopTrigger />
      </div>

      {/* Grid — desktop: 2 kolom, mobile: 1 kolom */}
      {moments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {moments.map((moment) => (
            <MomentCard key={moment.id} moment={moment} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center">
            <ImageOff className="w-6 h-6 text-stone-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-500">Belum ada momen</p>
            <p className="text-xs text-stone-400 mt-0.5">Ketuk tombol kamera untuk menambahkan</p>
          </div>
        </div>
      )}

      <MomentForm />
    </div>
  );
}