"use client";

import { useEffect, useRef } from "react";
import { subscribeAttendanceRecorded } from "@/lib/attendance/attendanceLive";

type RefreshFn = (options?: { silent?: boolean }) => Promise<void> | void;

interface Options {
  /** Poll interval while tab is visible (ms). 0 = disabled. */
  pollMs?: number;
  enabled?: boolean;
}

/**
 * Keeps attendance lists in sync after QR scan / check-in without manual refresh.
 * - Instant: custom event + BroadcastChannel
 * - Background: light polling when tab is visible (other devices / browsers)
 */
export function useAttendanceLiveRefresh(
  refresh: RefreshFn,
  { pollMs = 5000, enabled = true }: Options = {}
) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!enabled) return;

    const runSilent = () => {
      void refreshRef.current({ silent: true });
    };

    const unsubscribe = subscribeAttendanceRecorded(runSilent);

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPoll = () => {
      if (!pollMs || pollMs <= 0 || intervalId) return;
      intervalId = setInterval(() => {
        if (document.visibilityState === "visible") {
          runSilent();
        }
      }, pollMs);
    };

    const stopPoll = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        runSilent();
        startPoll();
      } else {
        stopPoll();
      }
    };

    if (document.visibilityState === "visible") {
      startPoll();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      unsubscribe();
      stopPoll();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, pollMs]);
}
