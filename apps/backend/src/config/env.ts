import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  CORS_ORIGIN: z.string().url().default("http://localhost:3001"),

  DATABASE_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith("mysql://"), {
      message: "DATABASE_URL must be a mysql:// connection string",
    }),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters — see .env.example"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  SNAPSHOT_INTERVAL_MS: z.coerce.number().int().positive().default(5_000),
  ROOM_EVICTION_GRACE_MS: z.coerce.number().int().nonnegative().default(30_000),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";

export const databaseLabel = (() => {
  try {
    const url = new URL(env.DATABASE_URL);
    return `${url.hostname}:${url.port || "3306"}${url.pathname}`;
  } catch {
    return "unknown";
  }
})();
