import type { ZodError } from "zod";

import type { ApiErrorBody } from "@lattice/shared";

export class ApiError extends Error {
  readonly status: number;
  readonly details?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    if (details) this.details = details;
  }

  static validation(error: ZodError): ApiError {
    const details: Record<string, string[]> = {};

    for (const issue of error.issues) {
      const field = issue.path.join(".") || "body";
      (details[field] ??= []).push(issue.message);
    }

    return new ApiError(422, "Validation failed", details);
  }

  toBody(): ApiErrorBody {
    return this.details
      ? { error: this.message, details: this.details }
      : { error: this.message };
  }
}
