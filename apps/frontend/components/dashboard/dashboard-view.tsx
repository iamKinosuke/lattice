"use client";

import { AlertCircle, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Board, BoardFilter, Workspace } from "@lattice/shared";

import {
  DeleteBoardDialog,
  RenameBoardDialog,
} from "@/components/dashboard/board-dialogs";
import { BoardGrid } from "@/components/dashboard/board-grid";
import { FilterTabs } from "@/components/dashboard/filter-tabs";
import {
  WorkspaceSelect,
  WorkspaceSidebar,
  type WorkspaceScope,
} from "@/components/dashboard/workspace-nav";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { ApiClientError, api } from "@/lib/api";

const NO_BOARDS: Board[] = [];

export function DashboardView({
  initialFilter,
  initialWorkspaceId,
}: {
  initialFilter: BoardFilter;
  initialWorkspaceId: string | null;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<BoardFilter>(initialFilter);
  const [scope, setScope] = useState<WorkspaceScope>(initialWorkspaceId);
  const [reloadToken, setReloadToken] = useState(0);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspacesLoading, setWorkspacesLoading] = useState(true);

  const requestKey = `${filter}|${scope ?? ""}|${reloadToken}`;

  const [data, setData] = useState<{ key: string; boards: Board[] } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(
    null,
  );

  const [actionError, setActionError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Board | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Board | null>(null);

  const loadError = failure?.key === requestKey ? failure.message : null;
  const fresh = data?.key === requestKey;
  const boardsLoading = !fresh && loadError === null;

  const boards = useMemo(
    () => (data?.key === requestKey ? data.boards : NO_BOARDS),
    [data, requestKey],
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "recent") params.set("filter", filter);
    if (scope) params.set("workspaceId", scope);

    const query = params.size > 0 ? `?${params}` : "";
    window.history.replaceState(null, "", `/dashboard${query}`);
  }, [filter, scope]);

  useEffect(() => {
    const controller = new AbortController();

    api
      .workspaces(controller.signal)
      .then(({ workspaces: next }) => {
        setWorkspaces(next);
        setWorkspacesLoading(false);
      })
      .catch((cause: unknown) => {
        if (isAbort(cause)) return;
        setWorkspacesLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const key = requestKey;

    api
      .boards({ filter, ...(scope ? { workspaceId: scope } : {}) }, controller.signal)
      .then(({ boards: next }) => setData({ key, boards: next }))
      .catch((cause: unknown) => {
        if (isAbort(cause)) return;

        setFailure({
          key,
          message:
            cause instanceof ApiClientError
              ? cause.message
              : "Could not load your boards.",
        });
      });

    return () => controller.abort();
  }, [filter, scope, requestKey]);

  const targetWorkspaceId = useMemo(() => {
    if (scope) return scope;
    return (
      workspaces.find((workspace) => workspace.role === "owner")?.id ??
      workspaces[0]?.id ??
      null
    );
  }, [scope, workspaces]);

  const heading = scope
    ? (workspaces.find((workspace) => workspace.id === scope)?.name ?? "Workspace")
    : "All boards";

  const patchBoards = useCallback((update: (boards: Board[]) => Board[]) => {
    setData((current) =>
      current ? { key: current.key, boards: update(current.boards) } : current,
    );
  }, []);

  const createBoard = useCallback(async () => {
    if (!targetWorkspaceId || creating) return;

    setCreating(true);
    setActionError(null);

    try {
      const board = await api.createBoard({ workspaceId: targetWorkspaceId });

      router.push(`/board/${board.id}`);
    } catch (cause) {
      setActionError(
        cause instanceof ApiClientError
          ? cause.message
          : "Could not create the board.",
      );
    } finally {
      setCreating(false);
    }
  }, [targetWorkspaceId, creating, router]);

  const toggleFavorite = useCallback(
    async (board: Board) => {
      const next = !board.isFavorite;
      const snapshot = boards;

      setActionError(null);

      patchBoards((current) =>
        current.flatMap((entry) => {
          if (entry.id !== board.id) return [entry];
          if (!next && filter === "favorites") return [];
          return [{ ...entry, isFavorite: next }];
        }),
      );

      try {
        await api.setFavorite(board.id, next);
      } catch (cause) {
        patchBoards(() => snapshot);
        setActionError(
          cause instanceof ApiClientError
            ? cause.message
            : "Could not update the favourite.",
        );
      }
    },
    [boards, filter, patchBoards],
  );

  const applyRename = useCallback(
    (updated: Board) => {
      patchBoards((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    },
    [patchBoards],
  );

  const applyDelete = useCallback(
    (boardId: string) => {
      patchBoards((current) => current.filter((entry) => entry.id !== boardId));
    },
    [patchBoards],
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6">
      <WorkspaceSidebar
        workspaces={workspaces}
        loading={workspacesLoading}
        value={scope}
        onChange={setScope}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            {heading}
          </h1>

          <Button
            onClick={createBoard}
            loading={creating}
            disabled={!targetWorkspaceId}
          >
            <Plus size={17} strokeWidth={2} aria-hidden />
            New board
          </Button>
        </div>

        <WorkspaceSelect workspaces={workspaces} value={scope} onChange={setScope} />

        <FilterTabs value={filter} onChange={setFilter} />

        {actionError ? (
          <Banner message={actionError} onDismiss={() => setActionError(null)} />
        ) : null}

        {loadError ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-danger/40 bg-danger-wash px-4 py-4">
            <p role="alert" className="text-sm font-medium text-danger-text">
              {loadError}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReloadToken((current) => current + 1)}
            >
              Try again
            </Button>
          </div>
        ) : (
          <BoardGrid
            boards={boards}
            loading={boardsLoading}
            filter={filter}
            canCreate={targetWorkspaceId !== null}
            onCreate={createBoard}
            onToggleFavorite={toggleFavorite}
            onRename={setRenameTarget}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      <RenameBoardDialog
        board={renameTarget}
        onClose={() => setRenameTarget(null)}
        onRenamed={applyRename}
      />
      <DeleteBoardDialog
        board={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={applyDelete}
      />
    </div>
  );
}

function Banner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-danger/40 bg-danger-wash px-3.5 py-3">
      <AlertCircle
        size={16}
        strokeWidth={1.75}
        aria-hidden
        className="mt-0.5 shrink-0 text-danger-text"
      />
      <p role="alert" className="flex-1 text-sm text-danger-text">
        {message}
      </p>
      <IconButton
        label="Dismiss"
        onClick={onDismiss}
        className="-my-1.5 -mr-1.5 h-7 w-7 text-danger-text hover:bg-danger/10 hover:text-danger-text"
      >
        <X size={14} strokeWidth={2} aria-hidden />
      </IconButton>
    </div>
  );
}

function isAbort(cause: unknown): boolean {
  return cause instanceof DOMException && cause.name === "AbortError";
}
