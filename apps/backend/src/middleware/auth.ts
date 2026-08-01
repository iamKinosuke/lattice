import type { Request, RequestHandler } from "express";

import { readAuthToken } from "../auth/cookie.js";
import { verifyToken } from "../auth/jwt.js";
import { ApiError } from "../lib/api-error.js";

export type AuthUser = {
  id: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = readAuthToken(req);

  if (!token) {
    throw new ApiError(401, "Authentication required");
  }

  const claims = verifyToken(token);
  if (!claims) {
    throw new ApiError(401, "Session expired or invalid");
  }

  req.user = { id: claims.sub, email: claims.email };
  next();
};

export function currentUser(req: Request): AuthUser {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  return req.user;
}
