import Konva from "konva";

import {
  DEFAULT_FILL,
  colorToCss,
  type Layer,
  type Point,
  type StrokePoint,
} from "@lattice/shared";

import { strokeToPathLayer } from "@/lib/canvas-math";
import { STROKE_SIZE, strokeToPathData } from "@/lib/stroke";

const MIN_SAMPLE_DISTANCE = 2;

const FLAT_PRESSURE = 0.5;

export class PenCapture {
  private readonly layer = new Konva.Layer({ listening: false });
  private readonly preview = new Konva.Path();

  private points: StrokePoint[] = [];
  private lastScreen: Point | null = null;

  constructor(stage: Konva.Stage) {
    this.layer.add(this.preview);
    stage.add(this.layer);
  }

  get active(): boolean {
    return this.points.length > 0;
  }

  get draft(): readonly StrokePoint[] | null {
    return this.active ? this.points : null;
  }

  begin(point: Point, screen: Point, pressure: number): void {
    this.points = [[point.x, point.y, pressure]];
    this.lastScreen = screen;
    this.preview.fill(colorToCss(DEFAULT_FILL));
    this.draw(false);
  }

  extend(point: Point, screen: Point, pressure: number): void {
    if (!this.active || !this.lastScreen) return;

    const dx = screen.x - this.lastScreen.x;
    const dy = screen.y - this.lastScreen.y;
    if (dx * dx + dy * dy < MIN_SAMPLE_DISTANCE * MIN_SAMPLE_DISTANCE) return;

    this.points.push([point.x, point.y, pressure]);
    this.lastScreen = screen;
    this.draw(false);
  }

  finish(): Layer | null {
    const points = this.points;
    this.reset();

    if (points.length < 2) return null;

    return strokeToPathLayer(points, DEFAULT_FILL, STROKE_SIZE / 2);
  }

  cancel(): void {
    this.reset();
  }

  destroy(): void {
    this.layer.destroy();
  }

  private reset(): void {
    this.points = [];
    this.lastScreen = null;
    this.preview.data("");
    this.layer.batchDraw();
  }

  private draw(last: boolean): void {
    this.preview.data(strokeToPathData(this.points, last));
    this.layer.batchDraw();
  }
}

export function pressureOf(event: PointerEvent): number {
  if (event.pointerType !== "pen") return FLAT_PRESSURE;

  return event.pressure > 0 ? event.pressure : FLAT_PRESSURE;
}
