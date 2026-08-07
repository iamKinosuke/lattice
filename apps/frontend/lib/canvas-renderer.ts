import Konva from "konva";
import type * as Y from "yjs";

import {
  colorToCss,
  getContrastingTextColor,
  getLayerIds,
  getLayers,
  layerFromY,
  type Layer,
  type LayerType,
} from "@lattice/shared";

import { strokeToPathData } from "@/lib/stroke";
import { textFont, textMetrics } from "@/lib/canvas-text";

export const LAYER_NODE_NAME = "layer";

type LayerNode = {
  readonly type: LayerType;
  readonly group: Konva.Group;
  readonly text?: Konva.Text;
  readonly apply: (layer: Layer) => void;
};

export class BoardRenderer {
  private readonly nodes = new Map<string, LayerNode>();

  constructor(
    private readonly doc: Y.Doc,
    private readonly target: Konva.Layer,
  ) {
    getLayers(doc).observeDeep(this.onLayersChanged);
    getLayerIds(doc).observe(this.onOrderChanged);

    this.reconcile();
    this.target.batchDraw();
  }

  node(id: string): Konva.Group | undefined {
    return this.nodes.get(id)?.group;
  }

  textNode(id: string): Konva.Text | undefined {
    return this.nodes.get(id)?.text;
  }

  destroy(): void {
    getLayers(this.doc).unobserveDeep(this.onLayersChanged);
    getLayerIds(this.doc).unobserve(this.onOrderChanged);

    for (const node of this.nodes.values()) node.group.destroy();
    this.nodes.clear();
  }

  private readonly onLayersChanged = (
    events: Y.YEvent<Y.AbstractType<unknown>>[],
  ): void => {
    let structural = false;

    for (const event of events) {
      const [id] = event.path;

      if (id === undefined) {
        structural = true;
        continue;
      }

      this.refresh(String(id));
    }

    if (structural) this.reconcile();
    this.target.batchDraw();
  };

  private readonly onOrderChanged = (): void => {
    this.reconcile();
    this.target.batchDraw();
  };

  private reconcile(): void {
    const ids = getLayerIds(this.doc).toArray();
    const live = new Set(ids);

    for (const [id, node] of this.nodes) {
      if (live.has(id)) continue;
      node.group.destroy();
      this.nodes.delete(id);
    }

    ids.forEach((id, index) => {
      const node = this.refresh(id);
      node?.group.zIndex(index);
    });
  }

  private refresh(id: string): LayerNode | null {
    const body = getLayers(this.doc).get(id);
    if (!body) return null;

    const layer = layerFromY(body);

    let node = this.nodes.get(id);

    if (node && node.type !== layer.type) {
      node.group.destroy();
      this.nodes.delete(id);
      node = undefined;
    }

    if (!node) {
      node = createLayerNode(id, layer);
      this.nodes.set(id, node);
      this.target.add(node.group);
    }

    node.apply(layer);
    return node;
  }
}

function createLayerNode(id: string, layer: Layer): LayerNode {
  const group = new Konva.Group({ id, name: LAYER_NODE_NAME, draggable: true });

  switch (layer.type) {
    case "rectangle": {
      const rect = new Konva.Rect();
      group.add(rect);

      return {
        type: "rectangle",
        group,
        apply: (next) => {
          if (next.type !== "rectangle") return;
          place(group, next);
          rect.setAttrs({
            width: next.width,
            height: next.height,
            fill: colorToCss(next.fill),
          });
        },
      };
    }

    case "ellipse": {
      const ellipse = new Konva.Ellipse({ radiusX: 0, radiusY: 0 });
      group.add(ellipse);

      return {
        type: "ellipse",
        group,
        apply: (next) => {
          if (next.type !== "ellipse") return;
          place(group, next);
          ellipse.setAttrs({
            x: next.width / 2,
            y: next.height / 2,
            radiusX: next.width / 2,
            radiusY: next.height / 2,
            fill: colorToCss(next.fill),
          });
        },
      };
    }

    case "path": {
      const path = new Konva.Path();
      group.add(path);

      return {
        type: "path",
        group,
        apply: (next) => {
          if (next.type !== "path") return;
          place(group, next);
          path.setAttrs({
            data: strokeToPathData(next.points, true, next.size),
            fill: colorToCss(next.fill),
          });
        },
      };
    }

    case "text": {
      const text = new Konva.Text({ verticalAlign: "middle" });
      group.add(text);

      return {
        type: "text",
        group,
        text,
        apply: (next) => {
          if (next.type !== "text") return;
          place(group, next);

          const { fontSize, box, align } = textMetrics(next);

          text.setAttrs({
            text: next.value,
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            align,
            fontSize,
            fontFamily: textFont(),
            fill: colorToCss(next.fill),
          });
        },
      };
    }

    case "note": {
      const background = new Konva.Rect({ cornerRadius: 4 });
      const text = new Konva.Text({ verticalAlign: "middle" });
      group.add(background, text);

      return {
        type: "note",
        group,
        text,
        apply: (next) => {
          if (next.type !== "note") return;
          place(group, next);

          background.setAttrs({
            width: next.width,
            height: next.height,
            fill: colorToCss(next.fill),
          });

          const { fontSize, box, align } = textMetrics(next);

          text.setAttrs({
            text: next.value,
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            align,
            fontSize,
            fontFamily: textFont(),
            fill: getContrastingTextColor(next.fill),
          });
        },
      };
    }
  }
}

function place(group: Konva.Group, layer: Layer): void {
  group.position({ x: layer.x, y: layer.y });
  group.rotation(layer.rotation);
}

