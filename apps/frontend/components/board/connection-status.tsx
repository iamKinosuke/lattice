"use client";

import { cn } from "@/lib/cn";

export type SyncStatus = "offline" | "connecting" | "connected";

const LABELS: Record<SyncStatus, { text: string; dot: string; tone: string }> = {
  offline: {
    text: "Not connected",
    dot: "bg-ink-subtle",
    tone: "text-ink-subtle",
  },
  connecting: {
    text: "Connecting…",
    dot: "bg-brand animate-pulse",
    tone: "text-ink-muted",
  },
  connected: {
    text: "Live",
    dot: "bg-success",
    tone: "text-ink-muted",
  },
};

export function ConnectionStatus({ status }: { status: SyncStatus }) {
  const { text, dot, tone } = LABELS[status];

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("flex shrink-0 items-center gap-1.5 text-xs font-medium", tone)}
    >
      <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", dot)} />
      <span className="hidden sm:inline">{text}</span>
    </span>
  );
}
