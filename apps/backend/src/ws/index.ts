import type { IncomingMessage, Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer, type WebSocket } from "ws";

import { AUTH_COOKIE, readCookie } from "../auth/cookie.js";
import { verifyToken } from "../auth/jwt.js";
import { findBoardAccess } from "../db/boards.js";
import { logger } from "../lib/logger.js";
import { applyMessage } from "./protocol.js";
import { addConnection, getRoom, removeConnection, type Room } from "./room.js";

const PING_INTERVAL_MS = 30_000;

const BOARD_PATH = /^\/ws\/board\/([A-Za-z0-9_-]{1,64})$/;

type SocketState = {
  room: Room;
  awaitingPong: boolean;
  pingTimer: NodeJS.Timeout;
};

export function attachWebSocketServer(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    void handleUpgrade(wss, req, socket, head);
  });
}

async function handleUpgrade(
  wss: WebSocketServer,
  req: IncomingMessage,
  socket: Duplex,
  head: Buffer,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const match = BOARD_PATH.exec(url.pathname);

  if (!match) {
    return refuse(socket, 404, "Not Found");
  }

  const boardId = match[1]!;
  const token = readToken(req, url);

  if (!token) {
    return refuse(socket, 401, "Unauthorized");
  }

  const claims = verifyToken(token);
  if (!claims) {
    return refuse(socket, 401, "Unauthorized");
  }

  const access = await findBoardAccess(boardId, claims.sub);
  if (!access) {
    return refuse(socket, 403, "Forbidden");
  }

  if (socket.destroyed) return;

  let room: Room;
  try {
    room = await getRoom(boardId);
  } catch (error) {
    logger.error("failed to open room", {
      boardId,
      error: error instanceof Error ? error.message : String(error),
    });
    return refuse(socket, 500, "Internal Server Error");
  }

  if (socket.destroyed) return;

  wss.handleUpgrade(req, socket, head, (ws) => {
    setupSocket(ws, room, claims.sub);
  });
}

function setupSocket(ws: WebSocket, room: Room, userId: string): void {
  addConnection(room, ws);

  const state: SocketState = {
    room,
    awaitingPong: false,
    pingTimer: setInterval(() => {
      if (state.awaitingPong) {
        logger.debug("terminating unresponsive socket", {
          boardId: room.boardId,
          userId,
        });
        ws.terminate();
        return;
      }

      state.awaitingPong = true;
      try {
        ws.ping();
      } catch {
        ws.terminate();
      }
    }, PING_INTERVAL_MS),
  };

  ws.on("pong", () => {
    state.awaitingPong = false;
  });

  ws.on("message", (data: Buffer | ArrayBuffer | Buffer[]) => {
    try {
      const reply = applyMessage(
        toUint8Array(data),
        room.doc,
        room.awareness,
        ws,
      );

      if (reply) {
        ws.send(reply);
      }
    } catch (error) {
      logger.warn("dropping socket after bad frame", {
        boardId: room.boardId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      ws.close(1003, "invalid frame");
    }
  });

  const cleanup = () => {
    clearInterval(state.pingTimer);
    removeConnection(room, ws);
  };

  ws.on("close", cleanup);
  ws.on("error", (error) => {
    logger.warn("socket error", {
      boardId: room.boardId,
      userId,
      error: error.message,
    });
  });
}

function readToken(req: IncomingMessage, url: URL): string | null {
  return (
    readCookie(req.headers.cookie, AUTH_COOKIE) ?? url.searchParams.get("token")
  );
}

function toUint8Array(data: Buffer | ArrayBuffer | Buffer[]): Uint8Array {
  if (Array.isArray(data)) {
    return new Uint8Array(Buffer.concat(data));
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

function refuse(socket: Duplex, status: number, message: string): void {
  if (socket.destroyed) return;

  socket.write(
    `HTTP/1.1 ${status} ${message}\r\n` +
      "Connection: close\r\n" +
      "Content-Length: 0\r\n" +
      "\r\n",
  );
  socket.destroy();
}
