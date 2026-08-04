"use client";

import { ArrowLeft, Download, Star, UserPlus } from "lucide-react";

import type { Board, PresenceUser } from "@lattice/shared";

import { ThemeToggle } from "@/components/app/theme-toggle";
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
  onExport,
  exporting,
  onShare,
}: {
  board: Board;
  status: SyncStatus;
  peers: PresenceUser[];
  selfId: string | null;
  onRenamed: (board: Board) => void;
  onToggleFavorite: () => void;
  onExport: () => void;
  exporting: boolean;
  onShare: () => void;
}) {
  return (
    <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-page px-2 sm:px-3">
      <IconLink label="Back to boards" href="/dashboard">
        <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
      </IconLink>

      <BoardTitle board={board} onRenamed={onRenamed} />

      <IconButton
        label={board.isFavorite ? "Remove from favourites" : "Add to favourites"}
        aria-pressed={board.isFavorite}
        active={board.isFavorite}
        onClick={onToggleFavorite}
      >
        <Star
          size={19}
          strokeWidth={1.75}
          fill={board.isFavorite ? "currentColor" : "none"}
          aria-hidden
        />
      </IconButton>

      <IconButton
        label="Export as PNG"
        onClick={onExport}
        disabled={exporting}
      >
        <Download size={19} strokeWidth={1.75} aria-hidden />
      </IconButton>

      {board.canShare ? (
        <IconButton label="Share this board" onClick={onShare}>
          <UserPlus size={19} strokeWidth={1.75} aria-hidden />
        </IconButton>
      ) : null}

      <ThemeToggle />

      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        <ConnectionStatus status={status} />
        <PresenceBar users={peers} selfId={selfId} />
      </div>
    </header>
  );
}
