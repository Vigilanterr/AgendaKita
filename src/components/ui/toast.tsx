"use client";

import { useEffect } from "react";

export type ToastTone = "success" | "error" | "info";

export type ToastItem = {
  id: number;
  tone: ToastTone;
  message: string;
};

const tones: Record<ToastTone, string> = {
  success: "border-accent/30 bg-accent-soft text-accent-ink",
  error: "border-danger/30 bg-danger-soft text-danger",
  info: "border-info/30 bg-info-soft text-info",
};

export default function ToastRegion({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      setTimeout(() => onDismiss(toast.id), 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-1/2 z-[--z-toast] flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => onDismiss(toast.id)}
          className={`pointer-events-auto rounded-md border px-4 py-2.5 text-left text-sm shadow-[--shadow-whisper] ${tones[toast.tone]}`}
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}
