import { Router } from "express";
import { z } from "zod";

import type {
  BoardListResponse,
  BoardMemberListResponse,
} from "@lattice/shared";

import {
  addBoardMember,
  createBoard,
  deleteBoard,
  findBoardAccess,
  findBoardForUser,
  listBoardMembers,
  listBoards,
  mayDeleteBoard,
  mayShareBoard,
  removeBoardMember,
  renameBoard,
  setBoardFavorite,
  setBoardMemberRole,
} from "../db/boards.js";
import { findWorkspaceMembership } from "../db/workspaces.js";
import { ApiError } from "../lib/api-error.js";
import { logger } from "../lib/logger.js";
import { currentUser, requireAuth } from "../middleware/auth.js";
import {
  boardTitleField,
  emailField,
  parseBody,
} from "../middleware/validate.js";

export const boardRouter = Router();

boardRouter.use(requireAuth);

type BoardParams = { boardId: string };
type MemberParams = BoardParams & { userId: string };

const filterSchema = z
  .enum(["recent", "owned", "shared", "favorites"])
  .default("recent");

const listQuerySchema = z.object({
  filter: filterSchema,
  workspaceId: z.string().uuid().optional(),
});

const createSchema = z.object({
  workspaceId: z.string().uuid("workspaceId must be a UUID"),
  title: boardTitleField.optional(),
});

const renameSchema = z.object({ title: boardTitleField });

const favoriteSchema = z.object({ favorite: z.boolean() });

const boardRoleSchema = z
  .enum(["editor", "viewer"])
  .refine((role) => role === "editor", {
    message: "Only the editor role is available yet",
  });

const addMemberSchema = z.object({
  email: emailField,
  role: boardRoleSchema.default("editor"),
});

const setRoleSchema = z.object({ role: boardRoleSchema });

boardRouter.get("/", async (req, res) => {
  const user = currentUser(req);
  const query = parseBody(listQuerySchema, req.query);

  const boards = await listBoards(user.id, query.filter, query.workspaceId);

  const body: BoardListResponse = { boards };
  res.json(body);
});

boardRouter.post("/", async (req, res) => {
  const user = currentUser(req);
  const body = parseBody(createSchema, req.body);

  const membership = await findWorkspaceMembership(body.workspaceId, user.id);
  if (!membership) {
    throw new ApiError(404, "Workspace not found");
  }

  const board = await createBoard({
    workspaceId: body.workspaceId,
    createdBy: user.id,
    title: body.title,
  });

  logger.info("board created", { boardId: board.id, userId: user.id });

  res.status(201).json(board);
});

boardRouter.get<BoardParams>("/:boardId", async (req, res) => {
  const user = currentUser(req);

  const board = await findBoardForUser(req.params.boardId, user.id);
  if (!board) {
    throw new ApiError(404, "Board not found");
  }

  res.json(board);
});

boardRouter.patch<BoardParams>("/:boardId", async (req, res) => {
  const user = currentUser(req);
  const body = parseBody(renameSchema, req.body);

  await requireBoardAccess(req.params.boardId, user.id);

  const board = await renameBoard(req.params.boardId, user.id, body.title);
  res.json(board);
});

boardRouter.put<BoardParams>("/:boardId/favorite", async (req, res) => {
  const user = currentUser(req);
  const body = parseBody(favoriteSchema, req.body);

  await requireBoardAccess(req.params.boardId, user.id);
  await setBoardFavorite(req.params.boardId, user.id, body.favorite);

  res.status(204).end();
});

boardRouter.delete<BoardParams>("/:boardId", async (req, res) => {
  const user = currentUser(req);
  const { boardId } = req.params;

  const access = await requireBoardAccess(boardId, user.id);

  if (!mayDeleteBoard(access, user.id)) {
    throw new ApiError(
      403,
      "Only the board's creator or a workspace admin can delete it",
    );
  }

  await deleteBoard(boardId);
  logger.info("board deleted", { boardId, userId: user.id });

  res.status(204).end();
});

boardRouter.get<BoardParams>("/:boardId/members", async (req, res) => {
  const user = currentUser(req);

  await requireBoardAccess(req.params.boardId, user.id);

  const members = await listBoardMembers(req.params.boardId);

  const body: BoardMemberListResponse = { members };
  res.json(body);
});

boardRouter.post<BoardParams>("/:boardId/members", async (req, res) => {
  const user = currentUser(req);
  const { boardId } = req.params;
  const body = parseBody(addMemberSchema, req.body);

  const access = await requireShare(boardId, user.id);

  const member = await addBoardMember({
    boardId,
    workspaceId: access.workspaceId,
    email: body.email,
    role: body.role,
    invitedBy: user.id,
  });

  logger.info("board member added", {
    boardId,
    userId: member.userId,
    by: user.id,
  });

  res.status(201).json(member);
});

boardRouter.patch<MemberParams>(
  "/:boardId/members/:userId",
  async (req, res) => {
    const user = currentUser(req);
    const body = parseBody(setRoleSchema, req.body);

    await requireShare(req.params.boardId, user.id);

    const member = await setBoardMemberRole(
      req.params.boardId,
      req.params.userId,
      body.role,
    );

    res.json(member);
  },
);

boardRouter.delete<MemberParams>(
  "/:boardId/members/:userId",
  async (req, res) => {
    const user = currentUser(req);
    const { boardId, userId } = req.params;

    await requireShare(boardId, user.id);
    await removeBoardMember(boardId, userId);

    logger.info("board member removed", { boardId, userId, by: user.id });

    res.status(204).end();
  },
);

async function requireBoardAccess(boardId: string, userId: string) {
  const access = await findBoardAccess(boardId, userId);

  if (!access) {
    throw new ApiError(404, "Board not found");
  }

  return access;
}

async function requireShare(boardId: string, userId: string) {
  const access = await requireBoardAccess(boardId, userId);

  if (!mayShareBoard(access, userId)) {
    throw new ApiError(
      403,
      "Only the board's creator or a workspace admin can share it",
    );
  }

  return access;
}
