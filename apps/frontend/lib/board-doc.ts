"use client";

import { useState } from "react";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";

import {
  DEFAULT_FILL,
  DEFAULT_LAYER_SIZE,
  MAX_LAYERS_PER_BOARD,
  getLayerIds,
  getLayers,
  layerToY,
  type Color,
  type InsertableLayerType,
  type Layer,
  type Point,
  type StrokePoint,
} from "@lattice/shared";

export const LOCAL_ORIGIN = "local";

export type BoardDoc = {
  doc: Y.Doc;
  awareness: Awareness;
  undo: Y.UndoManager;
};

export function useBoardDoc(boardId: string): BoardDoc {
  const [current, setCurrent] = useState(() => create(boardId));

  if (current.boardId !== boardId) {
    setCurrent(create(boardId));
  }

  return current;
}

function create(boardId: string): BoardDoc & { boardId: string } {
  const doc = new Y.Doc();

  return {
    boardId,
    doc,
    awareness: new Awareness(doc),
    undo: new Y.UndoManager([getLayers(doc), getLayerIds(doc)], {
      trackedOrigins: new Set([LOCAL_ORIGIN]),
    }),
  };
}

export function createLayer(
  type: InsertableLayerType,
  point: Point,
): Layer {
  const base = {
    x: point.x - DEFAULT_LAYER_SIZE / 2,
    y: point.y - DEFAULT_LAYER_SIZE / 2,
    width: DEFAULT_LAYER_SIZE,
    height: DEFAULT_LAYER_SIZE,
    rotation: 0,
    fill: DEFAULT_FILL,
  };

  switch (type) {
    case "rectangle":
    case "ellipse":
      return { ...base, type };
    case "text":
      return { ...base, type, value: "Text" };
    case "note":
      return { ...base, type, value: "Note" };
  }
}

export function insertLayer(doc: Y.Doc, layer: Layer): string | null {
  const layers = getLayers(doc);
  const layerIds = getLayerIds(doc);

  if (layerIds.length >= MAX_LAYERS_PER_BOARD) return null;

  const id = crypto.randomUUID();

  doc.transact(() => {
    layers.set(id, layerToY(layer));
    layerIds.push([id]);
  }, LOCAL_ORIGIN);

  return id;
}

export type LayerPatch = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  fill?: Color;
  value?: string;
  points?: StrokePoint[];
};

export function updateLayers(
  doc: Y.Doc,
  ids: Iterable<string>,
  patch: (id: string) => LayerPatch | null,
): void {
  const layers = getLayers(doc);

  doc.transact(() => {
    for (const id of ids) {
      const body = layers.get(id);
      if (!body) continue;

      const fields = patch(id);
      if (!fields) continue;

      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) body.set(key, value);
      }
    }
  }, LOCAL_ORIGIN);
}

export function deleteLayers(doc: Y.Doc, ids: readonly string[]): void {
  if (ids.length === 0) return;

  const layers = getLayers(doc);
  const layerIds = getLayerIds(doc);
  const doomed = new Set(ids);

  doc.transact(() => {
    for (const id of doomed) layers.delete(id);

    for (let i = layerIds.length - 1; i >= 0; i--) {
      if (doomed.has(layerIds.get(i))) layerIds.delete(i, 1);
    }
  }, LOCAL_ORIGIN);
}

export function reorderLayers(
  doc: Y.Doc,
  ids: readonly string[],
  edge: "front" | "back",
): void {
  if (ids.length === 0) return;

  const layerIds = getLayerIds(doc);
  const moving = new Set(ids);

  doc.transact(() => {
    const ordered = layerIds.toArray().filter((id) => moving.has(id));
    if (ordered.length === 0) return;

    for (let i = layerIds.length - 1; i >= 0; i--) {
      if (moving.has(layerIds.get(i))) layerIds.delete(i, 1);
    }

    layerIds.insert(edge === "front" ? layerIds.length : 0, ordered);
  }, LOCAL_ORIGIN);
}
