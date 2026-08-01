"use client";

import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";

import { useCanvasStore, zoomLimits } from "@/lib/canvas-store";

export function ZoomControls() {
  const scale = useCanvasStore((store) => store.camera.scale);
  const zoomIn = useCanvasStore((store) => store.zoomIn);
  const zoomOut = useCanvasStore((store) => store.zoomOut);
  const resetView = useCanvasStore((store) => store.resetView);

  const { atMin, atMax } = zoomLimits(scale);
  const percent = Math.round(scale * 100);

  return (
    <div
      className="pointer-events-auto absolute bottom-4 right-4 z-20 flex items-center gap-0.5 rounded-xl border border-line bg-surface/95 p-1.5 shadow-lg backdrop-blur"
      role="group"
      aria-label="Zoom"
    >
      <Control label="Zoom out" onClick={zoomOut} disabled={atMin}>
        <ZoomOut size={17} strokeWidth={1.75} aria-hidden />
      </Control>

      <button
        type="button"
        onClick={resetView}
        title="Reset view to 100%"
        className="tabular h-9 min-w-16 cursor-pointer rounded-lg px-2 text-sm font-medium text-ink transition-colors duration-150 hover:bg-raised"
      >
        {percent}%
        <span className="sr-only"> — reset view</span>
      </button>

      <Control label="Zoom in" onClick={zoomIn} disabled={atMax}>
        <ZoomIn size={17} strokeWidth={1.75} aria-hidden />
      </Control>

      <span aria-hidden className="mx-0.5 h-6 w-px bg-line" />

      <Control label="Reset view" onClick={resetView}>
        <Maximize2 size={16} strokeWidth={1.75} aria-hidden />
      </Control>
    </div>
  );
}

function Control({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 hover:bg-raised hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
