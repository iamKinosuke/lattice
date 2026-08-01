import type { Camera, Layer, Point, StrokePoint, XYWH } from "@lattice/shared";
import { MAX_ZOOM, MIN_ZOOM } from "@lattice/shared";

export function screenToCanvas(point: Point, camera: Camera): Point {
  return {
    x: (point.x - camera.x) / camera.scale,
    y: (point.y - camera.y) / camera.scale,
  };
}

export function canvasToScreen(point: Point, camera: Camera): Point {
  return {
    x: point.x * camera.scale + camera.x,
    y: point.y * camera.scale + camera.y,
  };
}

export function zoomAtPoint(
  camera: Camera,
  screenPoint: Point,
  scaleFactor: number,
): Camera {
  const scale = clamp(camera.scale * scaleFactor, MIN_ZOOM, MAX_ZOOM);

  const canvasPoint = screenToCanvas(screenPoint, camera);

  return {
    scale,
    x: screenPoint.x - canvasPoint.x * scale,
    y: screenPoint.y - canvasPoint.y * scale,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function rectFromPoints(a: Point, b: Point): XYWH {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

export function findIntersectingLayers(
  layerIds: readonly string[],
  layers: ReadonlyMap<string, Layer>,
  a: Point,
  b: Point,
): string[] {
  const rect = rectFromPoints(a, b);
  const ids: string[] = [];

  for (const layerId of layerIds) {
    const layer = layers.get(layerId);
    if (!layer) continue;

    if (
      rect.x + rect.width > layer.x &&
      rect.x < layer.x + layer.width &&
      rect.y + rect.height > layer.y &&
      rect.y < layer.y + layer.height
    ) {
      ids.push(layerId);
    }
  }

  return ids;
}

export function boundingBox(layers: Layer[]): XYWH | null {
  const first = layers[0];
  if (!first) return null;

  let left = first.x;
  let top = first.y;
  let right = first.x + first.width;
  let bottom = first.y + first.height;

  for (const layer of layers) {
    left = Math.min(left, layer.x);
    top = Math.min(top, layer.y);
    right = Math.max(right, layer.x + layer.width);
    bottom = Math.max(bottom, layer.y + layer.height);
  }

  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function strokeToPathLayer(
  points: StrokePoint[],
  fill: Layer["fill"],
  padding = 0,
): Omit<Extract<Layer, { type: "path" }>, "type"> & { type: "path" } {
  if (points.length < 2) {
    throw new Error("A stroke needs at least two points");
  }

  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (const [x, y] of points) {
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }

  left -= padding;
  top -= padding;
  right += padding;
  bottom += padding;

  return {
    type: "path",
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    rotation: 0,
    fill,
    points: points.map(([x, y, pressure]) => [x - left, y - top, pressure]),
  };
}

export function outlineToSvgPath(outline: number[][]): string {
  const first = outline[0];
  if (!first) return "";

  const d = outline.reduce<(string | number)[]>(
    (acc, point, index, arr) => {
      const next = arr[(index + 1) % arr.length]!;
      acc.push(point[0]!, point[1]!, (point[0]! + next[0]!) / 2, (point[1]! + next[1]!) / 2);
      return acc;
    },
    ["M", first[0]!, first[1]!, "Q"],
  );

  d.push("Z");
  return d.join(" ");
}
