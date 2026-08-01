import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { authRouter } from "./routes/auth.js";
import { boardRouter } from "./routes/boards.js";
import { healthRouter } from "./routes/health.js";
import { workspaceRouter } from "./routes/workspaces.js";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/workspaces", workspaceRouter);
  app.use("/api/boards", boardRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
