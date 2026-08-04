import * as Y from "yjs";
import { Awareness, removeAwarenessStates } from "y-protocols/awareness";
import type { WebSocket } from "ws";

import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { loadSnapshot, saveSnapshot } from "./persistence.js";
import { encodeAwareness, encodeSyncStep1, encodeUpdate } from "./protocol.js";

const PERSISTENCE_ORIGIN = Symbol("persistence");

type Connection = {
  userId: string;
  clients: Set<number>;
};

export type Room = {
  boardId: string;
  workspaceId: string;
  doc: Y.Doc;
  awareness: Awareness;
  conns: Map<WebSocket, Connection>;
  dirty: boolean;
  snapshotTimer: NodeJS.Timeout | null;
  evictionTimer: NodeJS.Timeout | null;
};

const rooms = new Map<string, Promise<Room>>();

let liveConnectionCount = 0;

export function getRoom(boardId: string, workspaceId: string): Promise<Room> {
  let pending = rooms.get(boardId);

  if (!pending) {
    pending = createRoom(boardId, workspaceId);
    rooms.set(boardId, pending);
    pending.catch(() => rooms.delete(boardId));
  }

  return pending;
}

async function createRoom(
  boardId: string,
  workspaceId: string,
): Promise<Room> {
  const doc = new Y.Doc();

  const snapshot = await loadSnapshot(boardId);
  if (snapshot) {
    Y.applyUpdate(doc, snapshot, PERSISTENCE_ORIGIN);
  }

  const awareness = new Awareness(doc);
  awareness.setLocalState(null);

  const room: Room = {
    boardId,
    workspaceId,
    doc,
    awareness,
    conns: new Map(),
    dirty: false,
    snapshotTimer: null,
    evictionTimer: null,
  };

  doc.on("update", (update: Uint8Array, origin: unknown) => {
    broadcast(room, encodeUpdate(update), origin);
    scheduleSnapshot(room);
  });

  awareness.on(
    "update",
    (
      changes: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown,
    ) => {
      const { added, updated, removed } = changes;

      if (origin && typeof origin === "object") {
        const connection = room.conns.get(origin as WebSocket);
        if (connection) {
          for (const id of added) connection.clients.add(id);
          for (const id of removed) connection.clients.delete(id);
        }
      }

      const changedClients = [...added, ...updated, ...removed];
      if (changedClients.length > 0) {
        broadcast(room, encodeAwareness(awareness, changedClients));
      }
    },
  );

  logger.info("room opened", { boardId, restored: snapshot !== null });
  return room;
}

export function addConnection(
  room: Room,
  ws: WebSocket,
  userId: string,
): void {
  room.conns.set(ws, { userId, clients: new Set() });
  liveConnectionCount += 1;

  if (room.evictionTimer) {
    clearTimeout(room.evictionTimer);
    room.evictionTimer = null;
  }

  ws.send(encodeSyncStep1(room.doc));

  const states = room.awareness.getStates();
  if (states.size > 0) {
    ws.send(encodeAwareness(room.awareness, [...states.keys()]));
  }

  logger.debug("connection added", {
    boardId: room.boardId,
    connections: room.conns.size,
  });
}

export function removeConnection(room: Room, ws: WebSocket): void {
  const connection = room.conns.get(ws);
  dropConnection(room, ws);

  if (connection && connection.clients.size > 0) {
    removeAwarenessStates(room.awareness, [...connection.clients], null);
  }

  logger.debug("connection removed", {
    boardId: room.boardId,
    connections: room.conns.size,
  });

  if (room.conns.size === 0) {
    void flushSnapshot(room);
    scheduleEviction(room);
  }
}

function dropConnection(room: Room, ws: WebSocket): void {
  if (room.conns.delete(ws)) {
    liveConnectionCount = Math.max(0, liveConnectionCount - 1);
  }
}

function broadcast(room: Room, message: Uint8Array, except?: unknown): void {
  for (const ws of [...room.conns.keys()]) {
    if (ws === except) continue;

    if (ws.readyState !== 1) {
      dropConnection(room, ws);
      continue;
    }

    try {
      ws.send(message);
    } catch (error) {
      logger.warn("broadcast failed, dropping connection", {
        boardId: room.boardId,
        error: error instanceof Error ? error.message : String(error),
      });
      ws.close();
      dropConnection(room, ws);
    }
  }
}

function scheduleSnapshot(room: Room): void {
  room.dirty = true;

  if (room.snapshotTimer) return;

  room.snapshotTimer = setTimeout(() => {
    room.snapshotTimer = null;
    void flushSnapshot(room);
  }, env.SNAPSHOT_INTERVAL_MS);
}

async function flushSnapshot(room: Room): Promise<void> {
  if (!room.dirty) return;

  room.dirty = false;

  try {
    await saveSnapshot(room.boardId, room.doc);
    logger.debug("snapshot saved", { boardId: room.boardId });
  } catch (error) {
    room.dirty = true;
    logger.error("snapshot save failed", {
      boardId: room.boardId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function scheduleEviction(room: Room): void {
  if (room.evictionTimer) return;

  room.evictionTimer = setTimeout(() => {
    room.evictionTimer = null;
    void evict(room);
  }, env.ROOM_EVICTION_GRACE_MS);
}

async function evict(room: Room): Promise<void> {
  if (room.conns.size > 0) return;

  if (room.snapshotTimer) {
    clearTimeout(room.snapshotTimer);
    room.snapshotTimer = null;
  }

  await flushSnapshot(room);

  if (room.conns.size > 0) return;

  rooms.delete(room.boardId);
  room.awareness.destroy();
  room.doc.destroy();

  logger.info("room evicted", { boardId: room.boardId });
}

const REVOKED = 1008;

export async function disconnectUserFromBoard(
  boardId: string,
  userId: string,
): Promise<number> {
  const room = await openRoom(boardId);
  return room ? closeUserSockets(room, userId) : 0;
}

export async function disconnectUserFromWorkspace(
  workspaceId: string,
  userId: string,
): Promise<number> {
  let closed = 0;

  for (const boardId of [...rooms.keys()]) {
    const room = await openRoom(boardId);
    if (room?.workspaceId !== workspaceId) continue;

    closed += closeUserSockets(room, userId);
  }

  return closed;
}

async function openRoom(boardId: string): Promise<Room | null> {
  const pending = rooms.get(boardId);
  if (!pending) return null;

  try {
    return await pending;
  } catch {
    return null;
  }
}

function closeUserSockets(room: Room, userId: string): number {
  let closed = 0;

  for (const [ws, connection] of [...room.conns]) {
    if (connection.userId !== userId) continue;

    ws.close(REVOKED, "access revoked");
    closed += 1;
  }

  if (closed > 0) {
    logger.info("closed sockets after revocation", {
      boardId: room.boardId,
      userId,
      closed,
    });
  }

  return closed;
}

export function getRoomStats(): { rooms: number; connections: number } {
  return { rooms: rooms.size, connections: liveConnectionCount };
}

export async function shutdownRooms(): Promise<void> {
  const pending = [...rooms.values()];

  await Promise.allSettled(
    pending.map(async (entry) => {
      const room = await entry;

      if (room.snapshotTimer) clearTimeout(room.snapshotTimer);
      if (room.evictionTimer) clearTimeout(room.evictionTimer);

      room.dirty = true;
      await flushSnapshot(room);

      for (const ws of room.conns.keys()) {
        ws.close(1001, "server shutting down");
      }

      room.awareness.destroy();
      room.doc.destroy();
    }),
  );

  rooms.clear();
  logger.info("all rooms flushed and closed");
}
