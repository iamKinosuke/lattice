import { Router, type Response } from "express";
import { z } from "zod";

import type { AuthResponse, PublicUser } from "@lattice/shared";

import { clearAuthCookie, setAuthCookie } from "../auth/cookie.js";
import { signToken } from "../auth/jwt.js";
import {
  hashPassword,
  verifyPassword,
  verifyPasswordAgainstNothing,
} from "../auth/password.js";
import {
  createUserWithPersonalWorkspace,
  findUserByEmail,
  findUserById,
  toPublicUser,
} from "../db/users.js";
import { ApiError } from "../lib/api-error.js";
import { logger } from "../lib/logger.js";
import { currentUser, requireAuth } from "../middleware/auth.js";
import {
  emailField,
  nameField,
  parseBody,
  passwordField,
} from "../middleware/validate.js";

export const authRouter = Router();

const registerSchema = z.object({
  email: emailField,
  password: passwordField,
  name: nameField,
});

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

authRouter.post("/register", async (req, res) => {
  const body = parseBody(registerSchema, req.body);

  const passwordHash = await hashPassword(body.password);
  const user = await createUserWithPersonalWorkspace({
    email: body.email,
    name: body.name,
    passwordHash,
  });

  logger.info("user registered", { userId: user.id });

  respondWithSession(res, user, 201);
});

authRouter.post("/login", async (req, res) => {
  const body = parseBody(loginSchema, req.body);

  const user = await findUserByEmail(body.email);

  const valid = user
    ? await verifyPassword(body.password, user.passwordHash)
    : await verifyPasswordAgainstNothing(body.password);

  if (!user || !valid) {
    throw new ApiError(401, "Invalid email or password");
  }

  respondWithSession(res, toPublicUser(user), 200);
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await findUserById(currentUser(req).id);

  if (!user) {
    clearAuthCookie(res);
    throw new ApiError(401, "Session expired or invalid");
  }

  res.json(toPublicUser(user));
});

function respondWithSession(
  res: Response,
  user: PublicUser,
  status: number,
): void {
  const token = signToken({ id: user.id, email: user.email });
  setAuthCookie(res, token);

  const body: AuthResponse = { token, user };
  res.status(status).json(body);
}
