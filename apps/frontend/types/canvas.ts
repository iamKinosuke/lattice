import type { InsertableLayerType, Point, XYWH } from "@lattice/shared";

export type CanvasMode =
  | "none"
  | "pressing"
  | "selection-net"
  | "translating"
  | "inserting"
  | "resizing"
  | "pencil"
  | "panning";

export type CanvasState =
  | { mode: "none" }
  | { mode: "pressing"; origin: Point }
  | { mode: "selection-net"; origin: Point; current?: Point }
  | { mode: "translating"; current: Point }
  | { mode: "inserting"; layerType: InsertableLayerType }
  | { mode: "resizing"; initialBounds: XYWH }
  | { mode: "pencil" }
  | { mode: "panning"; origin: Point };

export function activeTool(
  state: CanvasState,
): "select" | "pencil" | InsertableLayerType {
  switch (state.mode) {
    case "inserting":
      return state.layerType;
    case "pencil":
      return "pencil";
    default:
      return "select";
  }
}

export const DRAG_THRESHOLD = 5;
