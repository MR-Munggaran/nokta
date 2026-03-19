"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shield, CalendarHeart, Activity, MoreHorizontal } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home,          label: "Home" },
  { href: "/vault",     icon: Shield,        label: "Vault" },
  { href: "/dates",     icon: CalendarHeart, label: "Tanggal" },
  { href: "/habits",    icon: Activity,      label: "Aktivitas" },
  { href: "/more",      icon: MoreHorizontal,label: "Lainnya" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2 border-t border-black/[0.06]"
      style={{
        height: "72px",
        background: "rgba(247,246,243,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all active:scale-90"
          >
            <div
              className={`w-10 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                isActive ? "bg-stone-900" : ""
              }`}
            >
              <Icon
                className={`transition-all duration-200 ${
                  isActive ? "w-4 h-4 text-white" : "w-5 h-5 text-stone-400"
                }`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
            </div>
            <span
              className={`text-[10px] font-medium transition-colors duration-200 ${
                isActive ? "text-stone-800" : "text-stone-400"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}