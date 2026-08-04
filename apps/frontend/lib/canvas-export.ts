import type { Layer } from "konva/lib/Layer";
import type { Stage } from "konva/lib/Stage";

const PADDING = 32;
const TARGET_PIXEL_RATIO = 2;
const MAX_DIMENSION = 8192;
const BACKGROUND = "#ffffff";

type BoardCanvas = {
  stage: Stage;
  content: Layer;
};

let registered: BoardCanvas | null = null;

export function registerBoardCanvas(stage: Stage, content: Layer): void {
  registered = { stage, content };
}

export function releaseBoardCanvas(stage: Stage): void {
  if (registered?.stage === stage) registered = null;
}

export type BoardImage = {
  blob: Blob;
  width: number;
  height: number;
};

export type ExportFailure = "unavailable" | "empty";

export async function exportBoardPng(): Promise<BoardImage | ExportFailure> {
  const active = registered;
  if (!active) return "unavailable";

  const shot = captureContent(active);
  if (typeof shot === "string") return shot;

  const blob = await encodeWithBackground(shot);
  if (!blob) return "unavailable";

  return { blob, width: shot.width, height: shot.height };
}

function captureContent({
  stage,
  content,
}: BoardCanvas): HTMLCanvasElement | ExportFailure {
  const position = stage.position();
  const scale = stage.scale() ?? { x: 1, y: 1 };
  const concealed: Layer[] = [];

  stage.position({ x: 0, y: 0 });
  stage.scale({ x: 1, y: 1 });

  for (const layer of stage.getLayers()) {
    if (layer === content || !layer.visible()) continue;
    layer.visible(false);
    concealed.push(layer);
  }

  try {
    const box = content.getClientRect();
    if (box.width <= 0 || box.height <= 0) return "empty";

    const width = box.width + PADDING * 2;
    const height = box.height + PADDING * 2;

    const pixelRatio = Math.min(
      TARGET_PIXEL_RATIO,
      MAX_DIMENSION / width,
      MAX_DIMENSION / height,
    );

    stage.position({ x: PADDING - box.x, y: PADDING - box.y });

    return stage.toCanvas({ x: 0, y: 0, width, height, pixelRatio });
  } finally {
    for (const layer of concealed) layer.visible(true);
    stage.position(position);
    stage.scale(scale);
    stage.batchDraw();
  }
}

function encodeWithBackground(shot: HTMLCanvasElement): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = shot.width;
  canvas.height = shot.height;

  const context = canvas.getContext("2d");
  if (!context) return Promise.resolve(null);

  context.fillStyle = BACKGROUND;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(shot, 0, 0);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/png");
  });
}

export function boardImageFilename(title: string): string {
  const slug =
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "board";

  return `${slug}.png`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
