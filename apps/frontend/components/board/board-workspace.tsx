"use client";

import { useEffect, useMemo, useState } from "react";

import { userIdToColor, type Board, type PresenceUser } from "@lattice/shared";

import { BoardHeader } from "@/components/board/board-header";
import { BoardUnavailable } from "@/components/board/board-unavailable";
import { CanvasSurface } from "@/components/board/canvas-surface";
import { SelectionTools } from "@/components/board/selection-tools";
import { TOOL_SHORTCUTS, Toolbar } from "@/components/board/toolbar";
import { ZoomControls } from "@/components/board/zoom-controls";
import { Spinner } from "@/components/ui/spinner";
import { ApiClientError, api } from "@/lib/api";
import { deleteLayers, useBoardDoc } from "@/lib/board-doc";
import {
  boardImageFilename,
  downloadBlob,
  exportBoardPng,
} from "@/lib/canvas-export";
import { useBoardSync } from "@/lib/board-sync";
import { useCanvasStore } from "@/lib/canvas-store";
import { useSession } from "@/lib/use-session";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; board: Board }
  | { kind: "missing" }
  | { kind: "error"; message: string };

export function BoardWorkspace({ boardId }: { boardId: string }) {
  const { user } = useSession();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const resetView = useCanvasStore((store) => store.resetView);
  const setCanvasState = useCanvasStore((store) => store.setCanvasState);

  const { doc, awareness, undo } = useBoardDoc(boardId);

  const self = useMemo<PresenceUser | null>(
    () =>
      user
        ? {
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl,
            color: userIdToColor(user.id),
          }
        : null,
    [user],
  );

  const { status, peers } = useBoardSync(boardId, doc, awareness, self);

  useEffect(() => {
    const controller = new AbortController();

    api
      .board(boardId, controller.signal)
      .then((board) => {
        setState({ kind: "ready", board });

        document.title = `${board.title} · Lattice`;

        resetView();
        setCanvasState({ mode: "none" });
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;

        if (cause instanceof ApiClientError && cause.status === 404) {
          setState({ kind: "missing" });
          return;
        }

        setState({
          kind: "error",
          message:
            cause instanceof ApiClientError
              ? cause.message
              : "Could not open this board.",
        });
      });

    return () => controller.abort();
  }, [boardId, resetView, setCanvasState]);

  useEffect(() => {
    if (state.kind !== "ready") return;

    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;

      const key = event.key.toLowerCase();

      if (event.metaKey || event.ctrlKey) {
        if (key === "z") {
          event.preventDefault();
          if (event.shiftKey) undo.redo();
          else undo.undo();
        } else if (key === "y") {
          event.preventDefault();
          undo.redo();
        }
        return;
      }

      if (event.altKey) return;

      if (key === "delete" || key === "backspace") {
        const { selection, setSelection } = useCanvasStore.getState();
        if (selection.length === 0) return;

        event.preventDefault();
        deleteLayers(doc, selection);
        setSelection([]);
        return;
      }

      if (key === "escape") {
        useCanvasStore.getState().setSelection([]);
        return;
      }

      const next = TOOL_SHORTCUTS.get(key);
      if (!next) return;

      event.preventDefault();
      setCanvasState(next);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.kind, setCanvasState, undo, doc]);

  if (state.kind === "loading") {
    return (
      <div className="flex min-h-dvh flex-1 items-center justify-center bg-base">
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Spinner />
          Opening board…
        </p>
      </div>
    );
  }

  if (state.kind === "missing") {
    return (
      <BoardUnavailable
        title="This board is not here"
        body="It may have been deleted, or it belongs to a workspace you are not a member of."
      />
    );
  }

  if (state.kind === "error") {
    return <BoardUnavailable title="Could not open this board" body={state.message} />;
  }

  const { board } = state;

  async function toggleFavorite() {
    const next = !board.isFavorite;

    setActionError(null);
    setState({ kind: "ready", board: { ...board, isFavorite: next } });

    try {
      await api.setFavorite(board.id, next);
    } catch (cause) {
      setState({ kind: "ready", board });
      setActionError(
        cause instanceof ApiClientError
          ? cause.message
          : "Could not update the favourite.",
      );
    }
  }

  async function exportPng() {
    setActionError(null);
    setExporting(true);

    try {
      const result = await exportBoardPng();

      if (result === "empty") {
        setActionError("There is nothing on this board to export yet.");
        return;
      }

      if (result === "unavailable") {
        setActionError("The canvas is not ready yet — try again in a moment.");
        return;
      }

      downloadBlob(result.blob, boardImageFilename(board.title));
    } catch {
      setActionError("Could not export this board.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex h-dvh flex-1 flex-col overflow-hidden bg-base">
      <BoardHeader
        board={board}
        status={status}
        peers={peers}
        selfId={user?.id ?? null}
        onRenamed={(updated) => setState({ kind: "ready", board: updated })}
        onToggleFavorite={toggleFavorite}
        onExport={() => void exportPng()}
        exporting={exporting}
      />

      {actionError ? (
        <p
          role="alert"
          className="shrink-0 border-b border-danger/40 bg-danger-wash px-4 py-2 text-sm text-danger-text"
        >
          {actionError}
        </p>
      ) : null}

      <div className="relative flex flex-1 overflow-hidden">
        <CanvasSurface doc={doc} awareness={awareness} />
        <SelectionTools doc={doc} />
        <Toolbar />
        <ZoomControls />
      </div>
    </div>
  );
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}
