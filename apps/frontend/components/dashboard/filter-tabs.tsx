"use client";

import { Clock, Star, User, Users } from "lucide-react";

import type { BoardFilter } from "@lattice/shared";

import { cn } from "@/lib/cn";

export const FILTERS: Array<{
  value: BoardFilter;
  label: string;
  icon: typeof Clock;
}> = [
  { value: "recent", label: "Recent", icon: Clock },
  { value: "owned", label: "Created by you", icon: User },
  { value: "shared", label: "From others", icon: Users },
  { value: "favorites", label: "Favourites", icon: Star },
];

export function FilterTabs({
  value,
  onChange,
}: {
  value: BoardFilter;
  onChange: (next: BoardFilter) => void;
}) {
  return (
    <nav
      aria-label="Filter boards"
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
    >
      {FILTERS.map(({ value: filter, label, icon: Icon }) => {
        const active = filter === value;

        return (
          <button
            key={filter}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(filter)}
            className={cn(
              "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-medium",
              "transition-colors duration-150",
              active
                ? "bg-brand-wash text-brand-text"
                : "text-ink-muted hover:bg-raised hover:text-ink",
            )}
          >
            <Icon size={15} strokeWidth={1.75} aria-hidden />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
