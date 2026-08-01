import type { Board, BoardFilter, WorkspaceRole } from "@lattice/shared";

import { ApiError } from "../lib/api-error.js";
import { prisma } from "./prisma.js";
import { Prisma } from "../generated/prisma/client.js";

export type BoardAccess = {
  boardId: string;
  workspaceId: string;
  role: WorkspaceRole;
};

export async function findBoardAccess(
  boardId: string,
  userId: string,
): Promise<BoardAccess | null> {
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspace: { boards: { some: { id: boardId } } },
    },
    select: { workspaceId: true, role: true },
  });

  return membership
    ? {
        boardId,
        workspaceId: membership.workspaceId,
        role: membership.role,
      }
    : null;
}

const boardCardSelect = (userId: string) =>
  ({
    id: true,
    workspaceId: true,
    title: true,
    thumbnailPath: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
    creator: { select: { name: true } },
    favorites: { where: { userId }, select: { userId: true } },
  }) satisfies Prisma.BoardSelect;

type BoardCard = {
  id: string;
  workspaceId: string;
  title: string;
  thumbnailPath: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  creator: { name: string };
  favorites: { userId: string }[];
};

function toBoard(row: BoardCard): Board {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    title: row.title,
    thumbnailUrl: row.thumbnailPath ? `/static/${row.thumbnailPath}` : null,
    createdBy: row.createdBy,
    createdByName: row.creator.name,
    isFavorite: row.favorites.length > 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function buildBoardFilter(
  userId: string,
  filter: BoardFilter,
  workspaceId?: string,
): Prisma.BoardWhereInput {
  const visible: Prisma.BoardWhereInput = {
    workspace: { members: { some: { userId } } },
    ...(workspaceId ? { workspaceId } : {}),
  };

  switch (filter) {
    case "owned":
      return { ...visible, createdBy: userId };
    case "shared":
      return { ...visible, createdBy: { not: userId } };
    case "favorites":
      return { ...visible, favorites: { some: { userId } } };
    case "recent":
      return visible;
  }
}

export const BOARD_LIST_LIMIT = 200;

export async function listBoards(
  userId: string,
  filter: BoardFilter,
  workspaceId?: string,
): Promise<Board[]> {
  const rows = await prisma.board.findMany({
    where: buildBoardFilter(userId, filter, workspaceId),
    orderBy: { updatedAt: "desc" },
    take: BOARD_LIST_LIMIT,
    select: boardCardSelect(userId),
  });

  return rows.map(toBoard);
}

export async function findBoardForUser(
  boardId: string,
  userId: string,
): Promise<Board | null> {
  const row = await prisma.board.findFirst({
    where: {
      id: boardId,
      workspace: { members: { some: { userId } } },
    },
    select: boardCardSelect(userId),
  });

  return row ? toBoard(row) : null;
}

export async function createBoard(input: {
  workspaceId: string;
  createdBy: string;
  title?: string | undefined;
}): Promise<Board> {
  const row = await prisma.board.create({
    data: {
      workspaceId: input.workspaceId,
      createdBy: input.createdBy,
      ...(input.title ? { title: input.title } : {}),
    },
    select: boardCardSelect(input.createdBy),
  });

  return toBoard(row);
}

export async function renameBoard(
  boardId: string,
  userId: string,
  title: string,
): Promise<Board> {
  try {
    const row = await prisma.board.update({
      where: { id: boardId },
      data: { title },
      select: boardCardSelect(userId),
    });

    return toBoard(row);
  } catch (error) {
    throw translateMissingRecord(error);
  }
}

export function findBoardCreator(boardId: string) {
  return prisma.board.findUnique({
    where: { id: boardId },
    select: { createdBy: true },
  });
}

export async function deleteBoard(boardId: string): Promise<void> {
  try {
    await prisma.board.delete({ where: { id: boardId } });
  } catch (error) {
    throw translateMissingRecord(error);
  }
}

function translateMissingRecord(error: unknown): unknown {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return new ApiError(404, "Board not found");
  }

  return error;
}

export async function setBoardFavorite(
  boardId: string,
  userId: string,
  favorite: boolean,
): Promise<void> {
  if (favorite) {
    await prisma.boardFavorite.createMany({
      data: [{ boardId, userId }],
      skipDuplicates: true,
    });
    return;
  }

  await prisma.boardFavorite.deleteMany({ where: { boardId, userId } });
}
