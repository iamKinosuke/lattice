import { Router } from "express";
import { z } from "zod";

import type { BoardListResponse, WorkspaceRole } from "@lattice/shared";

import {
  createBoard,
  deleteBoard,
  findBoardAccess,
  findBoardCreator,
  findBoardForUser,
  listBoards,
  renameBoard,
  setBoardFavorite,
} from "../db/boards.js";
import { findWorkspaceMembership } from "../db/workspaces.js";
import { ApiError } from "../lib/api-error.js";
import { logger } from "../lib/logger.js";
import { currentUser, requireAuth } from "../middleware/auth.js";
import { boardTitleField, parseBody } from "../middleware/validate.js";

export const boardRouter = Router();

boardRouter.use(requireAuth);

type BoardParams = { boardId: string };

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
  const board = await findBoardCreator(boardId);

  const mayDelete = isAtLeastAdmin(access.role) || board?.createdBy === user.id;

  if (!mayDelete) {
    throw new ApiError(
      403,
      "Only the board's creator or a workspace admin can delete it",
    );
  }

  await deleteBoard(boardId);
  logger.info("board deleted", { boardId, userId: user.id });

  res.status(204).end();
});

async function requireBoardAccess(boardId: string, userId: string) {
  const access = await findBoardAccess(boardId, userId);

  if (!access) {
    throw new ApiError(404, "Board not found");
  }

  return access;
}

function isAtLeastAdmin(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}
