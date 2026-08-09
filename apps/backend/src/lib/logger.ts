import { isProduction } from "../config/env.js";

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, message: string, context?: Record<string, unknown>) {
  if (isProduction) {
    if (level !== "error") return;

    console.error(
      JSON.stringify({ level, message, ...context, ts: new Date().toISOString() }),
    );
    return;
  }

  const suffix = context ? ` ${JSON.stringify(context)}` : "";
  console[level === "debug" ? "log" : level](
    `[${level.toUpperCase()}] ${message}${suffix}`,
  );
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    emit("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) =>
    emit("error", message, context),
};
