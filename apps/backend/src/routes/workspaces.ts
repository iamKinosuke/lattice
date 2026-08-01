import { Router } from "express";

import type { WorkspaceListResponse } from "@lattice/shared";

import { listWorkspacesForUser } from "../db/workspaces.js";
import { currentUser, requireAuth } from "../middleware/auth.js";

export const workspaceRouter = Router();

workspaceRouter.use(requireAuth);

workspaceRouter.get("/", async (req, res) => {
  const workspaces = await listWorkspacesForUser(currentUser(req).id);

  const body: WorkspaceListResponse = { workspaces };
  res.json(body);
});
