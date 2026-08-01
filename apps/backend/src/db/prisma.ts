import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { databaseLabel, env, isProduction } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaMariaDb(env.DATABASE_URL, {
  onConnectionError: (error) => {
    logger.error("database connection error", { error: error.message });
  },
});

export const prisma = new PrismaClient({
  adapter,
  log: isProduction
    ? [{ emit: "event", level: "warn" }, { emit: "event", level: "error" }]
    : [
        { emit: "event", level: "query" },
        { emit: "event", level: "warn" },
        { emit: "event", level: "error" },
      ],
});

prisma.$on("error", (event) => {
  logger.error("prisma error", { message: event.message });
});

prisma.$on("warn", (event) => {
  logger.warn("prisma warning", { message: event.message });
});

if (!isProduction) {
  prisma.$on("query", (event) => {
    logger.debug("query", { duration: `${event.duration}ms`, query: event.query });
  });
}

export async function assertDatabaseReachable(): Promise<void> {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `cannot reach the database at ${databaseLabel} — check DATABASE_URL, ` +
        `that the server is running, and that the credentials are right:\n${detail}`,
    );
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
