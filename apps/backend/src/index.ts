import { createServer } from "node:http";

import { createApp } from "./app.js";
import { databaseLabel, env } from "./config/env.js";
import { assertDatabaseReachable, disconnectDatabase } from "./db/prisma.js";
import { logger } from "./lib/logger.js";
import { attachWebSocketServer } from "./ws/index.js";
import { shutdownRooms } from "./ws/room.js";

async function main() {
  await assertDatabaseReachable();
  logger.info("database reachable", { database: databaseLabel });

  const app = createApp();

  const server = createServer(app);
  attachWebSocketServer(server);

  server.listen(env.PORT, () => {
    logger.info("listening", {
      port: env.PORT,
      env: env.NODE_ENV,
      cors: env.CORS_ORIGIN,
    });
  });

  installShutdownHandlers(server);
}

function installShutdownHandlers(server: ReturnType<typeof createServer>) {
  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info("shutting down", { signal });

    server.close();

    try {
      await shutdownRooms();
      await disconnectDatabase();
      logger.info("shutdown complete");
      process.exit(0);
    } catch (error) {
      logger.error("shutdown failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error("unhandled rejection", { reason: String(reason) });
    void shutdown("unhandledRejection");
  });
}

main().catch((error) => {
  logger.error("failed to start", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
