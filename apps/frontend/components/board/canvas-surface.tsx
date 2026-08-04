"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";

import { useCanvasStore } from "@/lib/canvas-store";

const GRID_SPACING = 24;

const CanvasStage = dynamic(
  () => import("@/components/board/canvas-stage").then((mod) => mod.CanvasStage),
  { ssr: false },
);

export function CanvasSurface({
  doc,
  awareness,
}: {
  doc: Y.Doc;
  awareness: Awareness;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const camera = useCanvasStore((store) => store.camera);
  const setViewport = useCanvasStore((store) => store.setViewport);
  const zoomBy = useCanvasStore((store) => store.zoomBy);
  const setCamera = useCanvasStore((store) => store.setCamera);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setViewport({ width, height });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [setViewport]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    function onWheel(event: WheelEvent) {
      event.preventDefault();

      const rect = node!.getBoundingClientRect();
      const anchor = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      if (event.ctrlKey || event.metaKey) {
        zoomBy(Math.exp(-event.deltaY * 0.002), anchor);
        return;
      }

      const { camera: current } = useCanvasStore.getState();
      setCamera({
        ...current,
        x: current.x - event.deltaX,
        y: current.y - event.deltaY,
      });
    }

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [zoomBy, setCamera]);

  return (
    <div
      ref={ref}
      className="relative flex-1 touch-none overflow-hidden bg-sunken"
      style={{
        backgroundImage:
          "linear-gradient(var(--lat-line) 1px, transparent 1px), linear-gradient(90deg, var(--lat-line) 1px, transparent 1px)",
        backgroundSize: `${GRID_SPACING * camera.scale}px ${GRID_SPACING * camera.scale}px`,
        backgroundPosition: `${camera.x}px ${camera.y}px`,
      }}
    >
      <CanvasStage doc={doc} awareness={awareness} />
    </div>
  );
}
