const FALLBACK = "/dashboard";

export function safeNext(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate) return FALLBACK;
  if (!candidate.startsWith("/")) return FALLBACK;
  if (candidate.startsWith("//") || candidate.startsWith("/\\")) return FALLBACK;

  if (candidate === "/login" || candidate === "/register") return FALLBACK;

  return candidate;
}
