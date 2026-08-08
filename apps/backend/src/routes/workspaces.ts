import { Router } from "express";
import { z } from "zod";

import type {
  WorkspaceListResponse,
  WorkspaceMemberListResponse,
  WorkspaceRole,
} from "@lattice/shared";

import {
  addWorkspaceMember,
  findWorkspaceForUser,
  findWorkspaceMembership,
  listWorkspaceMembers,
  listWorkspacesForUser,
  removeWorkspaceMember,
  setWorkspaceMemberRole,
} from "../db/workspaces.js";
import { ApiError } from "../lib/api-error.js";
import { logger } from "../lib/logger.js";
import { currentUser, requireAuth } from "../middleware/auth.js";
import { emailField, parseBody } from "../middleware/validate.js";
import { disconnectUserFromWorkspace } from "../ws/room.js";

export const workspaceRouter = Router();

workspaceRouter.use(requireAuth);

type WorkspaceParams = { workspaceId: string };
type MemberParams = WorkspaceParams & { userId: string };

const roleSchema = z.enum(["admin", "member"]);

const addMemberSchema = z.object({
  email: emailField,
  role: roleSchema.default("member"),
});

const setRoleSchema = z.object({ role: roleSchema });

workspaceRouter.get("/", async (req, res) => {
  const workspaces = await listWorkspacesForUser(currentUser(req).id);

  const body: WorkspaceListResponse = { workspaces };
  res.json(body);
});

workspaceRouter.get<WorkspaceParams>("/:workspaceId", async (req, res) => {
  const user = currentUser(req);

  const workspace = await findWorkspaceForUser(req.params.workspaceId, user.id);
  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  res.json(workspace);
});

workspaceRouter.get<WorkspaceParams>(
  "/:workspaceId/members",
  async (req, res) => {
    const user = currentUser(req);
    const { workspaceId } = req.params;

    await requireMembership(workspaceId, user.id);

    const members = await listWorkspaceMembers(workspaceId);

    const body: WorkspaceMemberListResponse = { members };
    res.json(body);
  },
);

workspaceRouter.post<WorkspaceParams>(
  "/:workspaceId/members",
  async (req, res) => {
    const user = currentUser(req);
    const { workspaceId } = req.params;
    const body = parseBody(addMemberSchema, req.body);

    await requireAdmin(workspaceId, user.id);

    const member = await addWorkspaceMember({
      workspaceId,
      email: body.email,
      role: body.role,
    });

    logger.info("workspace member added", {
      workspaceId,
      userId: member.userId,
      by: user.id,
    });

    res.status(201).json(member);
  },
);

workspaceRouter.patch<MemberParams>(
  "/:workspaceId/members/:userId",
  async (req, res) => {
    const user = currentUser(req);
    const { workspaceId, userId } = req.params;
    const body = parseBody(setRoleSchema, req.body);

    await requireAdmin(workspaceId, user.id);

    const member = await setWorkspaceMemberRole(workspaceId, userId, body.role);
    res.json(member);
  },
);

workspaceRouter.delete<MemberParams>(
  "/:workspaceId/members/:userId",
  async (req, res) => {
    const user = currentUser(req);
    const { workspaceId, userId } = req.params;

    await requireAdmin(workspaceId, user.id);

    await removeWorkspaceMember(workspaceId, userId);
    await disconnectUserFromWorkspace(workspaceId, userId);

    logger.info("workspace member removed", {
      workspaceId,
      userId,
      by: user.id,
    });

    res.status(204).end();
  },
);

async function requireMembership(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceRole> {
  const membership = await findWorkspaceMembership(workspaceId, userId);

  if (!membership) {
    throw new ApiError(404, "Workspace not found");
  }

  return membership.role;
}

async function requireAdmin(
  workspaceId: string,
  userId: string,
): Promise<void> {
  const role = await requireMembership(workspaceId, userId);

  if (role !== "admin") {
    throw new ApiError(403, "Only a workspace admin can manage members");
  }
}
