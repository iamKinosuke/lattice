"use client";

import Konva from "konva";
import { useEffect, useRef } from "react";
import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";

import { INITIAL_PRESENCE, type Point } from "@lattice/shared";
import { getLayerIds } from "@lattice/shared";

import { screenToCanvas } from "@/lib/canvas-math";
import { useCanvasStore } from "@/lib/canvas-store";
import { PenCapture, pressureOf } from "@/lib/canvas-pen";
import { BoardRenderer } from "@/lib/canvas-renderer";
import { LAYER_NODE_NAME } from "@/lib/canvas-renderer";
import { registerBoardCanvas, releaseBoardCanvas } from "@/lib/canvas-export";
import { SelectionController } from "@/lib/canvas-selection";
import { TextEditor } from "@/lib/canvas-text-editor";
import { PresenceRenderer } from "@/lib/presence-renderer";
import { createLayer, insertLayer } from "@/lib/board-doc";
import { throttle } from "@/lib/throttle";
import { DRAG_THRESHOLD, activeTool, type CanvasState } from "@/types/canvas";

const PRESENCE_INTERVAL_MS = 50;

export function CanvasStage({
  doc,
  awareness,
}: {
  doc: Y.Doc;
  awareness: Awareness;
}) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = container.current;
    if (!node) return;

    const store = useCanvasStore;
    const { camera, viewport, canvasState } = store.getState();

    const stage = new Konva.Stage({
      container: node,
      width: viewport.width,
      height: viewport.height,
      x: camera.x,
      y: camera.y,
      scaleX: camera.scale,
      scaleY: camera.scale,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    const renderer = new BoardRenderer(doc, layer);
    const selection = new SelectionController(stage, doc, renderer);
    const pen = new PenCapture(stage);
    const presence = new PresenceRenderer(stage, doc, awareness);
    const editor = new TextEditor(node, doc, renderer);

    registerBoardCanvas(stage, layer);

    selection.setScale(camera.scale);
    presence.setScale(camera.scale);
    selection.apply(store.getState().selection);

    Konva.dragDistance = DRAG_THRESHOLD;

    node.style.cursor = cursorFor(canvasState);

    let cursor: Point | null = null;

    const presencePublisher = throttle(PRESENCE_INTERVAL_MS, () => {
      awareness.setLocalStateField("presence", {
        ...INITIAL_PRESENCE,
        cursor,
        selection: store.getState().selection,
        pencilDraft: pen.draft ? [...pen.draft] : null,
      });
    });

    const unsubscribe = store.subscribe((state, previous) => {
      if (state.camera !== previous.camera) {
        stage.position({ x: state.camera.x, y: state.camera.y });
        stage.scale({ x: state.camera.scale, y: state.camera.scale });
        presence.setScale(state.camera.scale);
        selection.setScale(state.camera.scale);
        editor.reflow(state.camera);
        stage.batchDraw();
      }

      if (state.viewport !== previous.viewport) {
        stage.size(state.viewport);
        stage.batchDraw();
      }

      if (state.canvasState !== previous.canvasState) {
        node.style.cursor = cursorFor(state.canvasState);
      }

      if (state.selection !== previous.selection) {
        selection.apply(state.selection);
        presencePublisher.call();
      }
    });

    const layerIds = getLayerIds(doc);
    const onOrderChanged = () => {
      store.getState().pruneSelection(new Set(layerIds.toArray()));
      selection.apply(store.getState().selection);
    };
    layerIds.observe(onOrderChanged);

    const onDocChanged = () => {
      selection.refresh();
      editor.reflow(store.getState().camera);
    };
    doc.on("update", onDocChanged);

    function pointerAt() {
      const screen = stage.getPointerPosition();
      if (!screen) return null;

      return { screen, canvas: screenToCanvas(screen, store.getState().camera) };
    }

    stage.on("pointerdown", (event) => {
      if (event.evt.button !== 0) return;

      const current = store.getState();
      const at = pointerAt();
      if (!at) return;

      if (current.canvasState.mode === "pencil") {
        event.evt.preventDefault();

        try {
          stage.content.setPointerCapture(event.evt.pointerId);
        } catch {
        }

        pen.begin(at.canvas, at.screen, pressureOf(event.evt));
        return;
      }

      if (current.canvasState.mode === "inserting") {
        const layerType = current.canvasState.layerType;

        const id = insertLayer(doc, createLayer(layerType, at.canvas));
        if (id === null) return;

        current.setCanvasState({ mode: "none" });

        if (layerType === "text" || layerType === "note") {
          requestAnimationFrame(() => {
            if (!disposed) editor.open(id, store.getState().camera);
          });
        }

        return;
      }

      if (activeTool(current.canvasState) !== "select") return;

      if (event.target.getParent()?.className === "Transformer") return;

      const hit = event.target.findAncestor(`.${LAYER_NODE_NAME}`, true) as
        | Konva.Group
        | undefined;

      if (!hit) {
        if (!event.evt.shiftKey) current.setSelection([]);
        selection.beginNet(at.canvas);
        return;
      }

      const id = hit.id();
      const chosen = current.selection;

      if (event.evt.shiftKey) {
        current.setSelection(
          chosen.includes(id)
            ? chosen.filter((other) => other !== id)
            : [...chosen, id],
        );
        return;
      }

      if (!chosen.includes(id)) current.setSelection([id]);
    });

    stage.on("dblclick dbltap", (event) => {
      const current = store.getState();
      if (activeTool(current.canvasState) !== "select") return;

      const hit = event.target.findAncestor(`.${LAYER_NODE_NAME}`, true) as
        | Konva.Group
        | undefined;

      if (hit) editor.open(hit.id(), current.camera);
    });

    stage.on("pointermove", (event) => {
      const at = pointerAt();
      if (!at) return;

      cursor = at.canvas;
      if (pen.active) pen.extend(at.canvas, at.screen, pressureOf(event.evt));
      if (selection.netActive) selection.dragNet(at.canvas);

      presencePublisher.call();
    });

    stage.on("pointerleave", () => {
      if (pen.active) return;

      cursor = null;
      presencePublisher.call();
    });

    stage.on("pointerup", () => {
      if (selection.netActive) {
        const at = pointerAt();
        const found = selection.endNet(at?.canvas ?? { x: 0, y: 0 });

        const current = store.getState();
        const merged = new Set([...current.selection, ...found]);
        current.setSelection([...merged]);
        return;
      }

      if (!pen.active) return;

      const layer = pen.finish();
      if (layer) insertLayer(doc, layer);

      presencePublisher.call();

    });

    stage.on("pointercancel", () => {
      pen.cancel();
      selection.cancelNet();
      presencePublisher.call();
    });

    const draggedLayer = (event: Konva.KonvaEventObject<unknown>) =>
      event.target.hasName(LAYER_NODE_NAME)
        ? (event.target as Konva.Group)
        : null;

    stage.on("dragstart", (event) => {
      const group = draggedLayer(event);
      if (!group) return;

      const current = store.getState();

      if (
        activeTool(current.canvasState) !== "select" ||
        !selection.beginDrag(group.id())
      ) {
        group.stopDrag();
        return;
      }

      if (!current.selection.includes(group.id())) {
        current.setSelection([group.id()]);
      }
    });

    stage.on("dragmove", (event) => {
      const group = draggedLayer(event);
      if (group) selection.dragTo(group.id());
    });

    stage.on("dragend", (event) => {
      if (draggedLayer(event)) selection.endDrag();
    });

    let disposed = false;
    void document.fonts.ready.then(() => {
      if (!disposed) layer.batchDraw();
    });

    return () => {
      disposed = true;
      releaseBoardCanvas(stage);
      editor.destroy();
      unsubscribe();
      layerIds.unobserve(onOrderChanged);
      doc.off("update", onDocChanged);
      presencePublisher.cancel();
      selection.destroy();
      presence.destroy();
      pen.destroy();
      renderer.destroy();
      stage.destroy();
    };
  }, [doc, awareness]);

  return <div ref={container} className="absolute inset-0" />;
}

function cursorFor(state: CanvasState): string {
  switch (state.mode) {
    case "inserting":
    case "pencil":
      return "crosshair";
    case "panning":
      return "grabbing";
    default:
      return "default";
  }
}
