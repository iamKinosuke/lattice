import { z } from "zod";

import { ApiError } from "../lib/api-error.js";

export function parseBody<Schema extends z.ZodTypeAny>(
  schema: Schema,
  body: unknown,
): z.infer<Schema> {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw ApiError.validation(result.error);
  }

  return result.data;
}

const trimmed = z.string().trim();

export const emailField = trimmed
  .min(1, "Email is required")
  .max(255, "Email must be at most 255 characters")
  .email("Must be a valid email address")
  .toLowerCase();

export const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const nameField = trimmed
  .min(1, "Name is required")
  .max(120, "Name must be at most 120 characters");

export const boardTitleField = trimmed
  .min(1, "Title is required")
  .max(255, "Title must be at most 255 characters");
