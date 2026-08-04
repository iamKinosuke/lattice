"use client";

import type { LucideIcon } from "lucide-react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { IconButton } from "@/components/ui/icon-button";
import {
  currentTheme,
  nextTheme,
  serverTheme,
  setTheme,
  subscribeTheme,
  type Theme,
} from "@/lib/theme";

const ICONS: Record<Theme, LucideIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const LABELS: Record<Theme, string> = {
  system: "Theme: matching your system — switch to light",
  light: "Theme: light — switch to dark",
  dark: "Theme: dark — switch to your system",
};

export function ThemeToggle({
  variant = "ghost",
}: {
  variant?: "ghost" | "surface";
}) {
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, serverTheme);
  const Icon = ICONS[theme];

  return (
    <IconButton
      label={LABELS[theme]}
      variant={variant}
      onClick={() => setTheme(nextTheme(theme))}
    >
      <Icon size={19} strokeWidth={1.75} aria-hidden />
    </IconButton>
  );
}
