import type { Layer, XYWH } from "@lattice/shared";

export type TextualLayer = Extract<Layer, { type: "text" } | { type: "note" }>;

export function isTextualLayer(layer: Layer): layer is TextualLayer {
  return layer.type === "text" || layer.type === "note";
}

const NOTE_PADDING = 10;

const MAX_FONT_SIZE = 96;

const TEXT_SCALE = 0.35;
const NOTE_SCALE = 0.15;

export type LayerTextMetrics = {
  fontSize: number;
  box: XYWH;
  align: "left" | "center";
};

export function textMetrics(layer: TextualLayer): LayerTextMetrics {
  if (layer.type === "note") {
    return {
      fontSize: fontSizeFor(layer.width, layer.height, NOTE_SCALE),
      box: {
        x: NOTE_PADDING,
        y: NOTE_PADDING,
        width: Math.max(0, layer.width - NOTE_PADDING * 2),
        height: Math.max(0, layer.height - NOTE_PADDING * 2),
      },
      align: "center",
    };
  }

  return {
    fontSize: fontSizeFor(layer.width, layer.height, TEXT_SCALE),
    box: { x: 0, y: 0, width: layer.width, height: layer.height },
    align: "left",
  };
}

function fontSizeFor(width: number, height: number, scale: number): number {
  return Math.min(height * scale, width * scale, MAX_FONT_SIZE);
}

let cachedFont: string | null = null;

export function textFont(): string {
  if (cachedFont !== null) return cachedFont;

  const token = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-lattice-sans")
    .trim();

  cachedFont = token
    ? `${token}, ui-sans-serif, system-ui, sans-serif`
    : "ui-sans-serif, system-ui, sans-serif";

  return cachedFont;
}
