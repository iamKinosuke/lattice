import type { ErrorRequestHandler, RequestHandler } from "express";

import { ApiError } from "../lib/api-error.js";
import { logger } from "../lib/logger.js";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Not found" });
};

function asBodyParserError(error: unknown): ApiError | null {
  if (typeof error !== "object" || error === null) return null;

  const candidate = error as { type?: unknown; status?: unknown };

  if (candidate.type === "entity.parse.failed") {
    return new ApiError(400, "Malformed JSON body");
  }

  if (candidate.type === "entity.too.large") {
    return new ApiError(413, "Request body too large");
  }

  return null;
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const bodyError = asBodyParserError(error);
  if (bodyError) {
    res.status(bodyError.status).json(bodyError.toBody());
    return;
  }

  if (error instanceof ApiError) {
    logger.debug("request rejected", {
      method: req.method,
      path: req.path,
      status: error.status,
      message: error.message,
    });

    res.status(error.status).json(error.toBody());
    return;
  }

  logger.error("unhandled request error", {
    method: req.method,
    path: req.path,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  res.status(500).json({ error: "Internal server error" });
};
