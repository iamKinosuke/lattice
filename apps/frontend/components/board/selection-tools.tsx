"use client";

import { BringToFront, SendToBack, Trash2 } from "lucide-react";
import type * as Y from "yjs";

import { colorToCss, type Color } from "@lattice/shared";

import { deleteLayers, reorderLayers, updateLayers } from "@/lib/board-doc";
import { useCanvasStore } from "@/lib/canvas-store";
import { cn } from "@/lib/cn";

const PALETTE: Color[] = [
  { r: 100, g: 116, b: 139 },
  { r: 220, g: 38, b: 38 },
  { r: 234, g: 88, b: 12 },
  { r: 202, g: 138, b: 4 },
  { r: 5, g: 150, b: 105 },
  { r: 8, g: 145, b: 178 },
  { r: 124, g: 58, b: 237 },
];

export function SelectionTools({ doc }: { doc: Y.Doc }) {
  const selection = useCanvasStore((store) => store.selection);
  const setSelection = useCanvasStore((store) => store.setSelection);

  if (selection.length === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label={`Actions for ${selection.length} selected ${
        selection.length === 1 ? "layer" : "layers"
      }`}
      className={cn(
        "pointer-events-auto absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-1",
        "rounded-xl border border-line bg-surface/95 p-1.5 shadow-lg backdrop-blur",
      )}
    >
      {PALETTE.map((color) => (
        <button
          key={colorToCss(color)}
          type="button"
          title={`Fill ${colorToCss(color)}`}
          onClick={() => updateLayers(doc, selection, () => ({ fill: color }))}
          className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-line-strong transition-transform duration-100 hover:scale-110"
          style={{ backgroundColor: colorToCss(color) }}
        >
          <span className="sr-only">Fill {colorToCss(color)}</span>
        </button>
      ))}

      <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-line" />

      <Action
        label="Bring to front"
        onClick={() => reorderLayers(doc, selection, "front")}
      >
        <BringToFront size={17} strokeWidth={1.75} aria-hidden />
      </Action>

      <Action
        label="Send to back"
        onClick={() => reorderLayers(doc, selection, "back")}
      >
        <SendToBack size={17} strokeWidth={1.75} aria-hidden />
      </Action>

      <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-line" />

      <Action
        label="Delete"
        danger
        onClick={() => {
          deleteLayers(doc, selection);
          setSelection([]);
        }}
      >
        <Trash2 size={17} strokeWidth={1.75} aria-hidden />
      </Action>
    </div>
  );
}

function Action({
  label,
  danger,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg",
        "transition-colors duration-150",
        danger
          ? "text-ink-muted hover:bg-danger-wash hover:text-danger-text"
          : "text-ink-muted hover:bg-raised hover:text-ink",
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
