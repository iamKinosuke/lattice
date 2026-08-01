import Konva from "konva";
import type * as Y from "yjs";

import {
  getLayers,
  layerFromY,
  readBoard,
  type Point,
  type StrokePoint,
} from "@lattice/shared";

import { updateLayers, type LayerPatch } from "@/lib/board-doc";
import { findIntersectingLayers, rectFromPoints } from "@/lib/canvas-math";
import type { BoardRenderer } from "@/lib/canvas-renderer";

const MIN_SIZE = 8;

const ROTATE_ANCHOR = "rotater";

export class SelectionController {
  private readonly layer = new Konva.Layer();
  private readonly transformer: Konva.Transformer;
  private readonly net = new Konva.Rect({
    visible: false,
    listening: false,
    fill: "rgba(124, 58, 237, 0.12)",
    stroke: "#7c3aed",
  });

  private readonly dragOrigin = new Map<string, Point>();
  private netOrigin: Point | null = null;
  private selection: readonly string[] = [];

  constructor(
    stage: Konva.Stage,
    private readonly doc: Y.Doc,
    private readonly renderer: BoardRenderer,
  ) {
    this.transformer = new Konva.Transformer({
      rotateEnabled: true,
      flipEnabled: false,
      ignoreStroke: true,
      anchorSize: 8,
      anchorStroke: "#7c3aed",
      borderStroke: "#7c3aed",
      boundBoxFunc: (previous, next) =>
        Math.abs(next.width) < MIN_SIZE || Math.abs(next.height) < MIN_SIZE
          ? previous
          : next,
    });

    this.transformer.anchorDragBoundFunc((_old, next) => {
      const anchor = this.transformer.getActiveAnchor();
      if (!anchor || anchor === ROTATE_ANCHOR) return next;

      const frame = this.transformer.getAbsoluteTransform();
      const local = frame.copy().invert().point(next);

      const width = this.transformer.width();
      const height = this.transformer.height();

      if (anchor.includes("left")) local.x = Math.min(local.x, width - MIN_SIZE);
      if (anchor.includes("right")) local.x = Math.max(local.x, MIN_SIZE);
      if (anchor.includes("top")) local.y = Math.min(local.y, height - MIN_SIZE);
      if (anchor.includes("bottom")) local.y = Math.max(local.y, MIN_SIZE);

      return frame.point(local);
    });

    this.transformer.on("transformend", () => this.endTransform());

    this.layer.add(this.transformer, this.net);
    stage.add(this.layer);
  }

  destroy(): void {
    this.layer.destroy();
  }

  setScale(scale: number): void {
    this.net.strokeWidth(1 / scale);
    this.layer.batchDraw();
  }

  refresh(): void {
    if (this.transformer.nodes().length === 0) return;

    this.transformer.forceUpdate();
    this.layer.batchDraw();
  }

  apply(selection: readonly string[]): void {
    this.selection = selection;

    const nodes = selection
      .map((id) => this.renderer.node(id))
      .filter((node): node is Konva.Group => node !== undefined);

    this.transformer.nodes(nodes);
    this.layer.batchDraw();
  }

  beginDrag(id: string): boolean {
    this.dragOrigin.clear();

    const ids = this.selection.includes(id) ? this.selection : [id];

    for (const layerId of ids) {
      const node = this.renderer.node(layerId);
      if (node) this.dragOrigin.set(layerId, { x: node.x(), y: node.y() });
    }

    return this.dragOrigin.size > 0;
  }

  dragTo(id: string): void {
    const start = this.dragOrigin.get(id);
    const node = this.renderer.node(id);
    if (!start || !node) return;

    const dx = node.x() - start.x;
    const dy = node.y() - start.y;

    for (const [layerId, origin] of this.dragOrigin) {
      if (layerId === id) continue;
      this.renderer
        .node(layerId)
        ?.position({ x: origin.x + dx, y: origin.y + dy });
    }
  }

  endDrag(): void {
    const moved = [...this.dragOrigin.keys()];
    this.dragOrigin.clear();
    if (moved.length === 0) return;

    updateLayers(this.doc, moved, (id) => {
      const node = this.renderer.node(id);
      return node ? { x: node.x(), y: node.y() } : null;
    });
  }

  endTransform(): void {
    const patches = new Map<string, LayerPatch>();

    for (const id of this.selection) {
      const node = this.renderer.node(id);
      const body = getLayers(this.doc).get(id);
      if (!node || !body) continue;

      const layer = layerFromY(body);
      const sx = node.scaleX();
      const sy = node.scaleY();

      const patch: LayerPatch = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: Math.max(MIN_SIZE, layer.width * sx),
        height: Math.max(MIN_SIZE, layer.height * sy),
      };

      if (layer.type === "path") {
        patch.points = layer.points.map(
          ([x, y, pressure]): StrokePoint => [x * sx, y * sy, pressure],
        );
      }

      patches.set(id, patch);
      node.scale({ x: 1, y: 1 });
    }

    updateLayers(this.doc, patches.keys(), (id) => patches.get(id) ?? null);

    this.refresh();
  }

  beginNet(origin: Point): void {
    this.netOrigin = origin;
    this.net.setAttrs({
      visible: true,
      x: origin.x,
      y: origin.y,
      width: 0,
      height: 0,
    });
    this.layer.batchDraw();
  }

  get netActive(): boolean {
    return this.netOrigin !== null;
  }

  dragNet(point: Point): void {
    if (!this.netOrigin) return;

    this.net.setAttrs(rectFromPoints(this.netOrigin, point));
    this.layer.batchDraw();
  }

  endNet(point: Point): string[] {
    const origin = this.netOrigin;
    this.netOrigin = null;
    this.net.visible(false);
    this.layer.batchDraw();

    if (!origin) return [];

    const board = readBoard(this.doc);

    return findIntersectingLayers(
      board.map((entry) => entry.id),
      new Map(board.map((entry) => [entry.id, entry.layer])),
      origin,
      point,
    );
  }

  cancelNet(): void {
    this.netOrigin = null;
    this.net.visible(false);
    this.layer.batchDraw();
  }
}
