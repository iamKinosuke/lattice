"use client";

import type { LucideIcon } from "lucide-react";
import { Circle, MousePointer2, Pencil, Square, StickyNote, Type } from "lucide-react";

import type { InsertableLayerType } from "@lattice/shared";

import { useCanvasStore } from "@/lib/canvas-store";
import { cn } from "@/lib/cn";
import { activeTool, type CanvasState } from "@/types/canvas";

type Tool = {
  id: "select" | "pencil" | InsertableLayerType;
  label: string;
  icon: LucideIcon;
  shortcut: string;
  next: CanvasState;
};

const TOOLS: Tool[] = [
  {
    id: "select",
    label: "Select",
    icon: MousePointer2,
    shortcut: "v",
    next: { mode: "none" },
  },
  {
    id: "pencil",
    label: "Draw",
    icon: Pencil,
    shortcut: "p",
    next: { mode: "pencil" },
  },
  {
    id: "rectangle",
    label: "Rectangle",
    icon: Square,
    shortcut: "r",
    next: { mode: "inserting", layerType: "rectangle" },
  },
  {
    id: "ellipse",
    label: "Ellipse",
    icon: Circle,
    shortcut: "o",
    next: { mode: "inserting", layerType: "ellipse" },
  },
  {
    id: "text",
    label: "Text",
    icon: Type,
    shortcut: "t",
    next: { mode: "inserting", layerType: "text" },
  },
  {
    id: "note",
    label: "Sticky note",
    icon: StickyNote,
    shortcut: "n",
    next: { mode: "inserting", layerType: "note" },
  },
];

export function Toolbar() {
  const canvasState = useCanvasStore((store) => store.canvasState);
  const setCanvasState = useCanvasStore((store) => store.setCanvasState);
  const current = activeTool(canvasState);

  return (
    <div
      className={cn(
        "pointer-events-auto absolute z-20 flex gap-1 rounded-xl border border-line bg-surface/95 p-1.5 shadow-lg backdrop-blur",
        "bottom-4 left-1/2 -translate-x-1/2 flex-row",
        "lg:bottom-auto lg:left-4 lg:top-1/2 lg:-translate-x-0 lg:-translate-y-1/2 lg:flex-col",
      )}
      role="toolbar"
      aria-label="Drawing tools"
      aria-orientation="horizontal"
    >
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        const active = current === tool.id;

        return (
          <button
            key={tool.id}
            type="button"
            aria-pressed={active}
            aria-keyshortcuts={tool.shortcut.toUpperCase()}
            title={`${tool.label} (${tool.shortcut.toUpperCase()})`}
            onClick={() => setCanvasState(tool.next)}
            className={cn(
              "inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg",
              "transition-colors duration-150",
              active
                ? "bg-brand text-brand-ink"
                : "text-ink-muted hover:bg-raised hover:text-ink",
            )}
          >
            <Icon size={18} strokeWidth={1.75} aria-hidden />
            <span className="sr-only">{tool.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export const TOOL_SHORTCUTS: ReadonlyMap<string, CanvasState> = new Map(
  TOOLS.map((tool) => [tool.shortcut, tool.next]),
);
