"use client";

import { useEffect, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import type * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

import {
  INITIAL_PRESENCE,
  type AwarenessState,
  type PresenceUser,
} from "@lattice/shared";

import type { SyncStatus } from "@/components/board/connection-status";
import { wsOrigin } from "@/lib/api";

const BOARD_PATH = "/ws/board";

export function useBoardSync(
  boardId: string,
  doc: Y.Doc,
  awareness: Awareness,
  self: PresenceUser | null,
): { status: SyncStatus; peers: PresenceUser[] } {
  const [connected, setConnected] = useState(false);
  const [synced, setSynced] = useState(false);
  const [peers, setPeers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const provider = new WebsocketProvider(
      `${wsOrigin()}${BOARD_PATH}`,
      boardId,
      doc,
      { awareness },
    );

    const onStatus = ({ status }: { status: string }) => {
      setConnected(status === "connected");
      if (status !== "connected") setSynced(false);
    };

    provider.on("status", onStatus);
    provider.on("sync", setSynced);

    return () => {
      provider.off("status", onStatus);
      provider.off("sync", setSynced);
      provider.destroy();
    };
  }, [boardId, doc, awareness]);

  useEffect(() => {
    if (!self) return;

    awareness.setLocalStateField("user", self);
    if (!awareness.getLocalState()?.presence) {
      awareness.setLocalStateField("presence", INITIAL_PRESENCE);
    }
  }, [awareness, self]);

  useEffect(() => {
    const update = () => {
      const next = readPeers(awareness);
      setPeers((previous) => (sameRoster(previous, next) ? previous : next));
    };

    update();
    awareness.on("change", update);
    return () => awareness.off("change", update);
  }, [awareness]);

  const status: SyncStatus = !connected
    ? "offline"
    : synced
      ? "connected"
      : "connecting";

  return { status, peers };
}

function readPeers(awareness: Awareness): PresenceUser[] {
  const byId = new Map<string, PresenceUser>();

  for (const raw of awareness.getStates().values()) {
    const user = (raw as Partial<AwarenessState>).user;
    if (!user?.id) continue;

    if (!byId.has(user.id)) byId.set(user.id, user);
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function sameRoster(a: PresenceUser[], b: PresenceUser[]): boolean {
  return a.length === b.length && a.every((user, i) => user.id === b[i]!.id);
}
