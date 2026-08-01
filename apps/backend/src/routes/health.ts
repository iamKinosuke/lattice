import { Router } from "express";

import { assertDatabaseReachable } from "../db/prisma.js";
import { getRoomStats } from "../ws/room.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  let database = "ok";

  try {
    await assertDatabaseReachable();
  } catch {
    database = "unreachable";
  }

  const healthy = database === "ok";

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    database,
    uptimeSeconds: Math.round(process.uptime()),
    ...getRoomStats(),
  });
});
