import type { Response } from "express";

import { AUTH_COOKIE } from "@lattice/shared";

import { isProduction } from "../config/env.js";
import { tokenExpiresAt } from "./jwt.js";

export { AUTH_COOKIE };

type RequestLike = {
  headers: {
    cookie?: string | undefined;
    authorization?: string | undefined;
  };
};

export function setAuthCookie(res: Response, token: string): void {
  const expires = tokenExpiresAt(token);

  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    ...(expires ? { expires } : {}),
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
  });
}

export function readCookie(
  header: string | undefined,
  name: string,
): string | null {
  if (!header) return null;

  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name && rest.length > 0) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

export function readAuthToken(req: RequestLike): string | null {
  const cookie = readCookie(req.headers.cookie, AUTH_COOKIE);
  if (cookie) return cookie;

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length).trim();
    return token.length > 0 ? token : null;
  }

  return null;
}
