"use client";

import { MAX_ZOOM, MIN_ZOOM, type Camera } from "@lattice/shared";
import { create } from "zustand";

import { zoomAtPoint } from "@/lib/canvas-math";
import type { CanvasState } from "@/types/canvas";

const IDENTITY_CAMERA: Camera = { x: 0, y: 0, scale: 1 };

const ZOOM_STEP = 1.2;

const EMPTY_SELECTION: string[] = [];

type CanvasStore = {
  camera: Camera;
  viewport: { width: number; height: number };
  canvasState: CanvasState;
  selection: string[];

  setCamera: (camera: Camera) => void;
  setViewport: (viewport: { width: number; height: number }) => void;
  setCanvasState: (canvasState: CanvasState) => void;
  setSelection: (selection: string[]) => void;
  pruneSelection: (live: ReadonlySet<string>) => void;

  zoomBy: (factor: number, anchor?: { x: number; y: number }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
};

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  camera: IDENTITY_CAMERA,
  viewport: { width: 0, height: 0 },
  canvasState: { mode: "none" },
  selection: EMPTY_SELECTION,

  setCamera: (camera) => set({ camera }),
  setViewport: (viewport) => set({ viewport }),

  setCanvasState: (canvasState) => {
    const clears = canvasState.mode === "pencil" || canvasState.mode === "inserting";

    set(clears ? { canvasState, selection: EMPTY_SELECTION } : { canvasState });
  },

  setSelection: (selection) =>
    set((state) =>
      sameSelection(state.selection, selection) ? state : { selection },
    ),

  pruneSelection: (live) =>
    set((state) => {
      const next = state.selection.filter((id) => live.has(id));
      return next.length === state.selection.length ? state : { selection: next };
    }),

  zoomBy: (factor, anchor) => {
    const { camera, viewport } = get();

    const point =
      anchor ?? { x: viewport.width / 2, y: viewport.height / 2 };

    set({ camera: zoomAtPoint(camera, point, factor) });
  },

  zoomIn: () => get().zoomBy(ZOOM_STEP),
  zoomOut: () => get().zoomBy(1 / ZOOM_STEP),

  resetView: () => set({ camera: IDENTITY_CAMERA }),
}));

function sameSelection(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

export function zoomLimits(scale: number): { atMin: boolean; atMax: boolean } {
  return {
    atMin: scale <= MIN_ZOOM * 1.001,
    atMax: scale >= MAX_ZOOM * 0.999,
  };
}
