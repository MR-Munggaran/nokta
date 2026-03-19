"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { lock } from "@/actions/masterPassword";

const IDLE_MS    = 4 * 60 * 1000; // 4 menit → warning
const WARNING_MS = 1 * 60 * 1000; // 1 menit warning → lock (total 5 menit)

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

interface AutoLockContextValue {
  showWarning: boolean;
  resetTimer:  () => void;
}

const AutoLockContext = createContext<AutoLockContextValue>({
  showWarning: false,
  resetTimer:  () => {},
});

export function useAutoLock() {
  return useContext(AutoLockContext);
}

export function AutoLockProvider({ children }: { children: React.ReactNode }) {
  const [showWarning, setShowWarning] = useState(false);
  const idleTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
  }, []);

  const triggerLock = useCallback(async () => {
    setShowWarning(false);
    await lock();
  }, []);

  const scheduleTimers = useCallback(() => {
    idleTimer.current = setTimeout(() => {
      setShowWarning(true);

      // Set warning timer → lock after 1 more min
      warningTimer.current = setTimeout(() => {
        void triggerLock();
      }, WARNING_MS);
    }, IDLE_MS);
  }, [triggerLock]);

  const resetTimer = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    scheduleTimers();
  }, [clearTimers, scheduleTimers]);

  useEffect(() => {
    scheduleTimers();

    // Reset on any user activity
    const handleActivity = () => resetTimer();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity));
    };
  }, [clearTimers, resetTimer, scheduleTimers]);

  return (
    <AutoLockContext.Provider value={{ showWarning, resetTimer }}>
      {children}
      {showWarning && <LockWarningBanner onDismiss={resetTimer} onLockNow={triggerLock} />}
    </AutoLockContext.Provider>
  );
}

// ─── WARNING BANNER ───────────────────────────────────────────────────────────

function LockWarningBanner({
  onDismiss,
  onLockNow,
}: {
  onDismiss: () => void;
  onLockNow: () => void;
}) {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-21 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-stone-900 text-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-xl">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <span className="text-amber-400 text-sm font-bold">{seconds}</span>
        </div>
        <p className="text-sm flex-1 leading-tight">
          Vault akan terkunci otomatis
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onLockNow}
            className="text-xs text-stone-400 hover:text-stone-200 transition-colors"
          >
            Kunci
          </button>
          <button
            onClick={onDismiss}
            className="text-xs bg-white text-stone-900 px-3 py-1.5 rounded-lg font-medium hover:bg-stone-100 transition-colors"
          >
            Tetap aktif
          </button>
        </div>
      </div>
    </div>
  );
}
