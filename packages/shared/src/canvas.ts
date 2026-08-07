export type Color = {
  r: number;
  g: number;
  b: number;
};

export type Point = {
  x: number;
  y: number;
};

export type XYWH = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Camera = {
  x: number;
  y: number;
  scale: number;
};

export const LAYER_TYPES = [
  "rectangle",
  "ellipse",
  "path",
  "text",
  "note",
] as const;

export type LayerType = (typeof LAYER_TYPES)[number];

type LayerBase = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: Color;
};

export type RectangleLayer = LayerBase & {
  type: "rectangle";
};

export type EllipseLayer = LayerBase & {
  type: "ellipse";
};

export type TextLayer = LayerBase & {
  type: "text";
  value: string;
};

export type NoteLayer = LayerBase & {
  type: "note";
  value: string;
};

export type StrokePoint = [x: number, y: number, pressure: number];

export type PathLayer = LayerBase & {
  type: "path";
  points: StrokePoint[];
  size?: number;
};

export type Layer =
  | RectangleLayer
  | EllipseLayer
  | PathLayer
  | TextLayer
  | NoteLayer;

export type InsertableLayerType = Exclude<LayerType, "path">;

export const DEFAULT_LAYER_SIZE = 100;

export const MAX_LAYERS_PER_BOARD = 10_000;

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 8;

export const DEFAULT_FILL: Color = { r: 100, g: 116, b: 139 };

export const DEFAULT_STROKE_SIZE = 8;

export function colorToCss({ r, g, b }: Color): string {
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export function getContrastingTextColor(color: Color): "black" | "white" {
  const luminance =
    0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
  return luminance > 182 ? "black" : "white";
}
