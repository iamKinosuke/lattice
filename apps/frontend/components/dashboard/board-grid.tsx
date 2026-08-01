"use client";

import { FolderOpen, Plus, Star, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Board, BoardFilter } from "@lattice/shared";

import { BoardCard } from "@/components/dashboard/board-card";
import { Button } from "@/components/ui/button";

const LIST_LIMIT = 200;

const GRID =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export function BoardGrid({
  boards,
  loading,
  filter,
  canCreate,
  onCreate,
  onToggleFavorite,
  onRename,
  onDelete,
}: {
  boards: Board[];
  loading: boolean;
  filter: BoardFilter;
  canCreate: boolean;
  onCreate: () => void;
  onToggleFavorite: (board: Board) => void;
  onRename: (board: Board) => void;
  onDelete: (board: Board) => void;
}) {
  if (loading) {
    return (
      <ul className={GRID} aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <li
            key={index}
            className="overflow-hidden rounded-lg border border-line bg-surface"
          >
            <div className="aspect-4/3 w-full animate-pulse bg-raised" />
            <div className="flex flex-col gap-2 px-3.5 py-3">
              <div className="h-3.5 w-3/4 animate-pulse rounded bg-raised" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-raised" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (boards.length === 0) {
    return <EmptyState filter={filter} canCreate={canCreate} onCreate={onCreate} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className={GRID}>
        {boards.map((board) => (
          <BoardCard
            key={board.id}
            board={board}
            onToggleFavorite={onToggleFavorite}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
      </ul>

      {boards.length >= LIST_LIMIT ? (
        <p className="text-sm text-ink-subtle">
          Showing the {LIST_LIMIT} most recently edited boards. Older ones are not
          listed — pagination is not built yet.
        </p>
      ) : null}
    </div>
  );
}

const EMPTY: Record<
  BoardFilter,
  { icon: LucideIcon; title: string; body: string; cta: boolean }
> = {
  recent: {
    icon: FolderOpen,
    title: "No boards yet",
    body: "Create one and it will appear here, ordered by when it was last edited.",
    cta: true,
  },
  owned: {
    icon: FolderOpen,
    title: "You have not created a board yet",
    body: "Boards you make show up here, whichever workspace they live in.",
    cta: true,
  },
  shared: {
    icon: Users,
    title: "Nothing from anyone else",
    body: "Boards created by other members of your workspaces appear here. Inviting people is not built yet, so this stays empty for now.",
    cta: false,
  },
  favorites: {
    icon: Star,
    title: "No favourites",
    body: "Star a board from its card and it will be waiting here.",
    cta: false,
  },
};

function EmptyState({
  filter,
  canCreate,
  onCreate,
}: {
  filter: BoardFilter;
  canCreate: boolean;
  onCreate: () => void;
}) {
  const { icon: Icon, title, body, cta } = EMPTY[filter];

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-line-strong bg-surface/50 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-raised text-ink-subtle">
        <Icon size={22} strokeWidth={1.5} aria-hidden />
      </span>

      <div className="flex max-w-sm flex-col gap-1.5">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-ink-muted">{body}</p>
      </div>

      {cta ? (
        <Button onClick={onCreate} disabled={!canCreate} className="mt-1">
          <Plus size={17} strokeWidth={2} aria-hidden />
          New board
        </Button>
      ) : null}
    </div>
  );
}
