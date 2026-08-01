"use client";

import { ArrowLeft, Star } from "lucide-react";

import type { Board, PresenceUser } from "@lattice/shared";

import { BoardTitle } from "@/components/board/board-title";
import { ConnectionStatus, type SyncStatus } from "@/components/board/connection-status";
import { PresenceBar } from "@/components/board/presence-bar";
import { IconButton, IconLink } from "@/components/ui/icon-button";

export function BoardHeader({
  board,
  status,
  peers,
  selfId,
  onRenamed,
  onToggleFavorite,
}: {
  board: Board;
  status: SyncStatus;
  peers: PresenceUser[];
  selfId: string | null;
  onRenamed: (board: Board) => void;
  onToggleFavorite: () => void;
}) {
  return (
    <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-base px-2 sm:px-3">
      <IconLink label="Back to boards" href="/dashboard">
        <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
      </IconLink>

      <BoardTitle board={board} onRenamed={onRenamed} />

      <IconButton
        label={board.isFavorite ? "Remove from favourites" : "Add to favourites"}
        aria-pressed={board.isFavorite}
        active={board.isFavorite}
        onClick={onToggleFavorite}
      >
        <Star
          size={17}
          strokeWidth={1.75}
          fill={board.isFavorite ? "currentColor" : "none"}
          aria-hidden
        />
      </IconButton>

      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        <ConnectionStatus status={status} />
        <PresenceBar users={peers} selfId={selfId} />
      </div>
    </header>
  );
}
