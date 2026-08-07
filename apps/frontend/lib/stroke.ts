import getStroke from "perfect-freehand";

import { DEFAULT_STROKE_SIZE, type StrokePoint } from "@lattice/shared";

import { outlineToSvgPath } from "@/lib/canvas-math";

const BASE_OPTIONS = {
  smoothing: 0.5,
  streamline: 0.5,
};

export function strokeToPathData(
  points: readonly StrokePoint[],
  last: boolean,
  size: number = DEFAULT_STROKE_SIZE,
): string {
  if (points.length < 2) return "";

  const first = points[0]![2];
  const flat = points.every(([, , pressure]) => pressure === first);

  return outlineToSvgPath(
    getStroke(points as StrokePoint[], {
      ...BASE_OPTIONS,
      size,
      thinning: flat ? 0 : 0.5,
      simulatePressure: flat,
      last,
    }),
  );
}
