import * as Y from "yjs";

import type { Layer } from "./canvas";

export const LAYERS_KEY = "layers";
export const LAYER_IDS_KEY = "layerIds";

export type YLayer = Y.Map<unknown>;

export function getLayers(doc: Y.Doc): Y.Map<YLayer> {
  return doc.getMap<YLayer>(LAYERS_KEY);
}

export function getLayerIds(doc: Y.Doc): Y.Array<string> {
  return doc.getArray<string>(LAYER_IDS_KEY);
}

export function layerToY(layer: Layer): YLayer {
  const map: YLayer = new Y.Map();
  for (const [key, value] of Object.entries(layer)) {
    map.set(key, value);
  }
  return map;
}

export function layerFromY(yLayer: YLayer): Layer {
  return yLayer.toJSON() as Layer;
}

export function readBoard(doc: Y.Doc): { id: string; layer: Layer }[] {
  const layers = getLayers(doc);
  const result: { id: string; layer: Layer }[] = [];

  for (const id of getLayerIds(doc)) {
    const yLayer = layers.get(id);
    if (yLayer) {
      result.push({ id, layer: layerFromY(yLayer) });
    }
  }

  return result;
}
