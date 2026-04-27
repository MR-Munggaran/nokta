"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Shield, CalendarHeart, Activity, MoreHorizontal,
  ListChecks, BookHeart, Camera, SmilePlus, Settings,
  Lock, LogOut, DatabaseIcon,
  DollarSignIcon,
} from "lucide-react";
import { lock, } from "@/actions/masterPassword";
import { logout } from "@/actions/auth";

const NAV_ITEMS = [
  { href: "/dashboard",   icon: Home,          label: "Dashboard" },
  { href: "/moments",     icon: Camera,        label: "Momen" },
  { href: "/mood",        icon: SmilePlus,     label: "Mood" },
  { href: "/habits",      icon: Activity,      label: "Habits" },
  { href: "/dates",       icon: CalendarHeart, label: "Tanggal" },
  { href: "/bucket-list", icon: ListChecks,    label: "Bucket List" },
  { href: "/letters",     icon: BookHeart,     label: "Surat" },
  { href: "/schedule",    icon: DatabaseIcon,        label: "Schedule" },
  { href: "/vault",       icon: Shield,        label: "Vault" },
  { href: "/settings",    icon: Settings,      label: "Pengaturan" },
] as const;

interface Props {
  name: string;
}

export function Sidebar({ name }: Props) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 h-dvh sticky top-0 border-r border-stone-200 bg-[#F7F6F3] px-4 py-6">

      {/* Logo */}
      <div className="px-3 mb-8">
        <h1 className="text-xl font-bold text-stone-800 tracking-tight">nokta<span className="text-rose-400">.</span></h1>
        <p className="text-xs text-stone-400 mt-0.5">Satu titik untuk semua yang penting</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-stone-900 text-white"
                  : "text-stone-500 hover:bg-stone-200/60 hover:text-stone-800"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2.5 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + actions */}
      <div className="space-y-2 pt-4 border-t border-stone-200">
        {/* Profile */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-xl bg-stone-200 flex items-center justify-center text-sm font-bold text-stone-500 shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-800 truncate">{name}</p>
            <p className="text-[11px] text-stone-400">Nokta Member</p>
          </div>
        </div>

        {/* Lock */}
        <form action={lock}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
          >
            <Lock className="w-4 h-4 shrink-0" />
            Kunci Vault
          </button>
        </form>

        <a href="https://www.firafi.online/">
          <div
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
          >
            <DollarSignIcon className="w-4 h-4 shrink-0" />
            Firafi
          </div>
        </a>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}