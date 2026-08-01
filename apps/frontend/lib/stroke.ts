import getStroke from "perfect-freehand";

import type { StrokePoint } from "@lattice/shared";

import { outlineToSvgPath } from "@/lib/canvas-math";

export const STROKE_SIZE = 8;

const BASE_OPTIONS = {
  size: STROKE_SIZE,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
};

export function strokeToPathData(
  points: readonly StrokePoint[],
  last: boolean,
): string {
  if (points.length < 2) return "";

  const first = points[0]![2];
  const simulatePressure = points.every(([, , pressure]) => pressure === first);

  return outlineToSvgPath(
    getStroke(points as StrokePoint[], {
      ...BASE_OPTIONS,
      simulatePressure,
      last,
    }),
  );
}
