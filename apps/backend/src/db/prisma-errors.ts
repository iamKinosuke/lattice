import { Prisma } from "../generated/prisma/client.js";

function property(source: unknown, key: string): unknown {
  return typeof source === "object" && source !== null
    ? (source as Record<string, unknown>)[key]
    : undefined;
}

function collectStrings(value: unknown, into: string[]): void {
  if (typeof value === "string") {
    into.push(value);
    return;
  }

  if (!Array.isArray(value)) return;

  for (const entry of value) {
    if (typeof entry === "string") into.push(entry);
  }
}

export function uniqueConstraintTargets(error: unknown): string[] {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return [];
  }

  const targets: string[] = [];

  collectStrings(property(error.meta, "target"), targets);

  const constraint = property(
    property(property(error.meta, "driverAdapterError"), "cause"),
    "constraint",
  );

  collectStrings(property(constraint, "index"), targets);
  collectStrings(property(constraint, "fields"), targets);

  return targets;
}

export function violatesUniqueConstraint(
  error: unknown,
  pattern: RegExp,
): boolean {
  return uniqueConstraintTargets(error).some((target) => pattern.test(target));
}
