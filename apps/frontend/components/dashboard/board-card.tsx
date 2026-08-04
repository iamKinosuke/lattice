"use client";

import { MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
import Link from "next/link";

import type { Board } from "@lattice/shared";

import { IconButton } from "@/components/ui/icon-button";
import { Menu } from "@/components/ui/menu";
import { assetUrl } from "@/lib/api";
import { boardTint } from "@/lib/board-tint";
import { formatExactTime, formatRelativeTime } from "@/lib/format-time";

export function BoardCard({
  board,
  onToggleFavorite,
  onRename,
  onDelete,
}: {
  board: Board;
  onToggleFavorite: (board: Board) => void;
  onRename: (board: Board) => void;
  onDelete: (board: Board) => void;
}) {
  const tint = boardTint(board.id);

  return (
    <li className="group relative">
      <Link
        href={`/board/${board.id}`}
        className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-sm transition-[border-color,box-shadow] duration-150 hover:border-line-strong hover:shadow-md"
      >
        <div
          className="board-tint relative aspect-4/3 w-full overflow-hidden"
          style={
            {
              "--tint-light": tint.light,
              "--tint-dark": tint.dark,
            } as React.CSSProperties
          }
        >
          {board.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={assetUrl(board.thumbnailUrl)}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <>
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "linear-gradient(rgb(0 0 0 / 0.07) 1px, transparent 1px), linear-gradient(90deg, rgb(0 0 0 / 0.07) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center font-display text-5xl font-semibold text-ink/15"
              >
                {board.title.trim().charAt(0).toUpperCase() || "?"}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 px-3.5 py-3">
          <h3
            className="truncate pr-20 text-[0.9375rem] font-medium text-ink"
            title={board.title}
          >
            {board.title}
          </h3>
          <p className="truncate text-[0.8125rem] text-ink-subtle">
            {board.createdByName}
            {" · "}
            <time dateTime={board.updatedAt} title={formatExactTime(board.updatedAt)}>
              {formatRelativeTime(board.updatedAt)}
            </time>
          </p>
        </div>
      </Link>

      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <IconButton
          variant="surface"
          label={board.isFavorite ? "Remove from favourites" : "Add to favourites"}
          aria-pressed={board.isFavorite}
          active={board.isFavorite}
          onClick={() => onToggleFavorite(board)}
        >
          <Star
            size={18}
            strokeWidth={1.75}
            fill={board.isFavorite ? "currentColor" : "none"}
            aria-hidden
          />
        </IconButton>

        <div className="rounded-md border border-line bg-surface/90 shadow-sm backdrop-blur">
          <Menu
            label={`Actions for ${board.title}`}
            trigger={<MoreHorizontal size={18} strokeWidth={1.75} aria-hidden />}
            items={[
              { label: "Rename", icon: Pencil, onSelect: () => onRename(board) },
              ...(board.canDelete
                ? [
                    {
                      label: "Delete",
                      icon: Trash2,
                      danger: true,
                      onSelect: () => onDelete(board),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>
    </li>
  );
}
