const CHANNEL_NAME = "erb-attendance-live";

export type AttendanceLiveEvent = {
  type: "attendance_recorded";
  at: number;
};

/** Notify other tabs / components that attendance was recorded. */
export function notifyAttendanceRecorded() {
  if (typeof window === "undefined") return;

  const event: AttendanceLiveEvent = {
    type: "attendance_recorded",
    at: Date.now(),
  };

  window.dispatchEvent(new CustomEvent("erb:attendance-recorded", { detail: event }));

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(event);
    channel.close();
  } catch {
    // BroadcastChannel not supported — custom event still works in same tab
  }
}

/** Subscribe to attendance updates (same tab, other tabs, polling companion). */
export function subscribeAttendanceRecorded(onEvent: () => void) {
  if (typeof window === "undefined") return () => {};

  const onCustom = () => onEvent();
  window.addEventListener("erb:attendance-recorded", onCustom);

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = () => onEvent();
  } catch {
    channel = null;
  }

  return () => {
    window.removeEventListener("erb:attendance-recorded", onCustom);
    channel?.close();
  };
}
