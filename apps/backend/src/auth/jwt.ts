import jwt from "jsonwebtoken";
import type { TokenClaims } from "@lattice/shared";

import { env } from "../config/env.js";

export function signToken(user: { id: string; email: string }): string {
  return jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenClaims | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenClaims;
  } catch {
    return null;
  }
}

export function tokenExpiresAt(token: string): Date | null {
  const decoded = jwt.decode(token);

  if (decoded && typeof decoded === "object" && typeof decoded.exp === "number") {
    return new Date(decoded.exp * 1000);
  }

  return null;
}
