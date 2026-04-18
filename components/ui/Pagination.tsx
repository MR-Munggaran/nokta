"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Link
        href={`${baseUrl}?page=${currentPage - 1}`}
        className={`p-2 rounded-xl border transition-colors ${
          currentPage <= 1 
            ? "pointer-events-none opacity-30 bg-stone-50 border-stone-100 text-stone-400" 
            : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
      </Link>

      <div className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 rounded-full text-xs font-medium text-stone-500">
        <span>Halaman {currentPage}</span>
        <span className="text-stone-300 mx-1">/</span>
        <span>{totalPages}</span>
      </div>

      <Link
        href={`${baseUrl}?page=${currentPage + 1}`}
        className={`p-2 rounded-xl border transition-colors ${
          currentPage >= totalPages 
            ? "pointer-events-none opacity-30 bg-stone-50 border-stone-100 text-stone-400" 
            : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
        }`}
        aria-label="Next page"
      >
        <ChevronRight className="w-5 h-5" />
      </Link>
    </div>
  );
}
