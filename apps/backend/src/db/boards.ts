import type {
  Board,
  BoardFilter,
  BoardMember,
  BoardRole,
  WorkspaceRole,
} from "@lattice/shared";

import { ApiError } from "../lib/api-error.js";
import { prisma } from "./prisma.js";
import { violatesUniqueConstraint } from "./prisma-errors.js";
import { findUserSummaryByEmail } from "./users.js";
import { Prisma } from "../generated/prisma/client.js";

export type BoardAccess = {
  boardId: string;
  workspaceId: string;
  createdBy: string;
  workspaceRole: WorkspaceRole | null;
  boardRole: BoardRole | null;
};

export function isAtLeastWorkspaceAdmin(
  role: WorkspaceRole | null,
): role is "owner" | "admin" {
  return role === "owner" || role === "admin";
}

export function mayShareBoard(access: BoardAccess, userId: string): boolean {
  return (
    isAtLeastWorkspaceAdmin(access.workspaceRole) || access.createdBy === userId
  );
}

export function mayDeleteBoard(access: BoardAccess, userId: string): boolean {
  return mayShareBoard(access, userId);
}

export async function findBoardAccess(
  boardId: string,
  userId: string,
): Promise<BoardAccess | null> {
  const row = await prisma.board.findUnique({
    where: { id: boardId },
    select: {
      workspaceId: true,
      createdBy: true,
      workspace: {
        select: { members: { where: { userId }, select: { role: true } } },
      },
      members: { where: { userId }, select: { role: true } },
    },
  });

  if (!row) return null;

  const workspaceRole = row.workspace.members[0]?.role ?? null;
  const boardRole = row.members[0]?.role ?? null;

  if (!workspaceRole && !boardRole) return null;

  return {
    boardId,
    workspaceId: row.workspaceId,
    createdBy: row.createdBy,
    workspaceRole,
    boardRole,
  };
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
    workspace: {
      select: { members: { where: { userId }, select: { role: true } } },
    },
    members: { where: { userId }, select: { role: true } },
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
  workspace: { members: { role: WorkspaceRole }[] };
  members: { role: BoardRole }[];
};

function toBoard(row: BoardCard, userId: string): Board {
  const access: BoardAccess = {
    boardId: row.id,
    workspaceId: row.workspaceId,
    createdBy: row.createdBy,
    workspaceRole: row.workspace.members[0]?.role ?? null,
    boardRole: row.members[0]?.role ?? null,
  };

  return {
    id: row.id,
    workspaceId: row.workspaceId,
    title: row.title,
    thumbnailUrl: row.thumbnailPath ? `/static/${row.thumbnailPath}` : null,
    createdBy: row.createdBy,
    createdByName: row.creator.name,
    isFavorite: row.favorites.length > 0,
    canShare: mayShareBoard(access, userId),
    canDelete: mayDeleteBoard(access, userId),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function visibleToUser(userId: string): Prisma.BoardWhereInput {
  return {
    OR: [
      { workspace: { members: { some: { userId } } } },
      { members: { some: { userId } } },
    ],
  };
}

function buildBoardFilter(
  userId: string,
  filter: BoardFilter,
  workspaceId?: string,
): Prisma.BoardWhereInput {
  const visible: Prisma.BoardWhereInput = {
    ...visibleToUser(userId),
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

  return rows.map((row) => toBoard(row, userId));
}

export async function findBoardForUser(
  boardId: string,
  userId: string,
): Promise<Board | null> {
  const row = await prisma.board.findFirst({
    where: { id: boardId, ...visibleToUser(userId) },
    select: boardCardSelect(userId),
  });

  return row ? toBoard(row, userId) : null;
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

  return toBoard(row, input.createdBy);
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

    return toBoard(row, userId);
  } catch (error) {
    throw translateMissingRecord(error);
  }
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

const boardMemberSelect = {
  role: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true, avatarUrl: true } },
} as const;

type BoardMemberRow = {
  role: BoardRole;
  createdAt: Date;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
};

function toBoardMember(row: BoardMemberRow): BoardMember {
  return {
    userId: row.user.id,
    name: row.user.name,
    email: row.user.email,
    avatarUrl: row.user.avatarUrl,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listBoardMembers(
  boardId: string,
): Promise<BoardMember[]> {
  const rows = await prisma.boardMember.findMany({
    where: { boardId },
    orderBy: { createdAt: "asc" },
    select: boardMemberSelect,
  });

  return rows.map(toBoardMember);
}

export async function addBoardMember(input: {
  boardId: string;
  workspaceId: string;
  email: string;
  role: BoardRole;
  invitedBy: string;
}): Promise<BoardMember> {
  const user = await findUserSummaryByEmail(input.email);
  if (!user) {
    throw new ApiError(404, "No account uses that email address");
  }

  const workspaceMembership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: input.workspaceId,
        userId: user.id,
      },
    },
    select: { role: true },
  });

  if (workspaceMembership) {
    throw new ApiError(
      409,
      "They already reach this board through the workspace",
    );
  }

  try {
    const row = await prisma.boardMember.create({
      data: {
        boardId: input.boardId,
        userId: user.id,
        role: input.role,
        invitedBy: input.invitedBy,
      },
      select: boardMemberSelect,
    });

    return toBoardMember(row);
  } catch (error) {
    if (violatesUniqueConstraint(error, /^PRIMARY$|board_?id|user_?id/i)) {
      throw new ApiError(409, "They already have access to this board");
    }

    throw error;
  }
}

export async function setBoardMemberRole(
  boardId: string,
  userId: string,
  role: BoardRole,
): Promise<BoardMember> {
  try {
    const row = await prisma.boardMember.update({
      where: { boardId_userId: { boardId, userId } },
      data: { role },
      select: boardMemberSelect,
    });

    return toBoardMember(row);
  } catch (error) {
    throw translateMissingMember(error);
  }
}

export async function removeBoardMember(
  boardId: string,
  userId: string,
): Promise<void> {
  try {
    await prisma.boardMember.delete({
      where: { boardId_userId: { boardId, userId } },
    });
  } catch (error) {
    throw translateMissingMember(error);
  }
}

function translateMissingMember(error: unknown): unknown {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return new ApiError(404, "They do not have access to this board");
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
