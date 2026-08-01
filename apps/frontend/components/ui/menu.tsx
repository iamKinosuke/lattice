"use client";

import type { LucideIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

export type MenuItem = {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export function Menu({
  label,
  items,
  trigger,
  align = "end",
}: {
  label: string;
  items: MenuItem[];
  trigger: ReactNode;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();

  const enabled = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.disabled);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    setActiveIndex(-1);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) close(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    itemRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  function step(direction: 1 | -1) {
    if (enabled.length === 0) return;

    const position = enabled.findIndex(({ index }) => index === activeIndex);
    const next =
      position === -1
        ? direction === 1
          ? 0
          : enabled.length - 1
        : (position + direction + enabled.length) % enabled.length;

    setActiveIndex(enabled[next]!.index);
  }

  function openWith(index: number) {
    setOpen(true);
    setActiveIndex(index);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(false) : setOpen(true))}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            openWith(enabled[0]?.index ?? -1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            openWith(enabled.at(-1)?.index ?? -1);
          }
        }}
        className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-subtle transition-colors duration-150 hover:bg-raised hover:text-ink aria-expanded:bg-raised aria-expanded:text-ink"
      >
        {trigger}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={(event) => {
            switch (event.key) {
              case "ArrowDown":
                event.preventDefault();
                step(1);
                break;
              case "ArrowUp":
                event.preventDefault();
                step(-1);
                break;
              case "Home":
                event.preventDefault();
                setActiveIndex(enabled[0]?.index ?? -1);
                break;
              case "End":
                event.preventDefault();
                setActiveIndex(enabled.at(-1)?.index ?? -1);
                break;
              case "Escape":
                event.preventDefault();
                close(true);
                break;
              case "Tab":
                close(false);
                break;
            }
          }}
          className={cn(
            "absolute top-full z-40 mt-1 min-w-44 overflow-hidden rounded-lg border border-line bg-surface p-1 shadow-lg",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                tabIndex={-1}
                onClick={() => {
                  close(true);
                  item.onSelect();
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors duration-150",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  item.danger
                    ? "text-danger-text hover:bg-danger-wash"
                    : "text-ink hover:bg-raised",
                )}
              >
                {Icon ? <Icon size={16} strokeWidth={1.75} aria-hidden /> : null}
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
