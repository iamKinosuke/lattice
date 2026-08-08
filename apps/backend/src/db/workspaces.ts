import type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from "@lattice/shared";

import { ApiError } from "../lib/api-error.js";
import { prisma } from "./prisma.js";
import { violatesUniqueConstraint } from "./prisma-errors.js";
import { findUserSummaryByEmail } from "./users.js";
import { Prisma } from "../generated/prisma/client.js";

const membershipSelect = {
  userId: true,
  role: true,
  workspace: {
    select: {
      id: true,
      name: true,
      slug: true,
      ownerId: true,
      createdAt: true,
      _count: { select: { members: true } },
    },
  },
} as const;

type MembershipRow = {
  userId: string;
  role: WorkspaceRole;
  workspace: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    createdAt: Date;
    _count: { members: number };
  };
};

function toWorkspace({ userId, role, workspace }: MembershipRow): Workspace {
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    role,
    isCreator: workspace.ownerId === userId,
    memberCount: workspace._count.members,
    createdAt: workspace.createdAt.toISOString(),
  };
}

export async function listWorkspacesForUser(
  userId: string,
): Promise<Workspace[]> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    orderBy: [{ joinedAt: "asc" }, { workspaceId: "asc" }],
    select: membershipSelect,
  });

  return memberships.map(toWorkspace);
}

export async function findWorkspaceForUser(
  workspaceId: string,
  userId: string,
): Promise<Workspace | null> {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: membershipSelect,
  });

  return membership ? toWorkspace(membership) : null;
}

export async function findWorkspaceMembership(
  workspaceId: string,
  userId: string,
) {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });
}

const memberSelect = {
  role: true,
  joinedAt: true,
  user: { select: { id: true, name: true, email: true, avatarUrl: true } },
  workspace: { select: { ownerId: true } },
} as const;

type MemberRow = {
  role: WorkspaceRole;
  joinedAt: Date;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  workspace: { ownerId: string };
};

function toMember(row: MemberRow): WorkspaceMember {
  return {
    userId: row.user.id,
    name: row.user.name,
    email: row.user.email,
    avatarUrl: row.user.avatarUrl,
    role: row.role,
    isCreator: row.workspace.ownerId === row.user.id,
    joinedAt: row.joinedAt.toISOString(),
  };
}

export async function listWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const rows = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    orderBy: [{ joinedAt: "asc" }, { userId: "asc" }],
    select: memberSelect,
  });

  return rows.map(toMember);
}

export async function addWorkspaceMember(input: {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
}): Promise<WorkspaceMember> {
  const user = await findUserSummaryByEmail(input.email);
  if (!user) {
    throw new ApiError(404, "No account uses that email address");
  }

  try {
    const row = await prisma.workspaceMember.create({
      data: {
        workspaceId: input.workspaceId,
        userId: user.id,
        role: input.role,
      },
      select: memberSelect,
    });

    return toMember(row);
  } catch (error) {
    if (violatesUniqueConstraint(error, /^PRIMARY$|workspace_?id|user_?id/i)) {
      throw new ApiError(409, "They are already in this workspace");
    }

    throw error;
  }
}

export async function setWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
): Promise<WorkspaceMember> {
  if (role === "member") {
    await guardWorkspaceCreator(workspaceId, userId);
  }

  try {
    const row = await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role },
      select: memberSelect,
    });

    return toMember(row);
  } catch (error) {
    throw translateMissingMember(error);
  }
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<void> {
  await guardWorkspaceCreator(workspaceId, userId);

  try {
    await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  } catch (error) {
    throw translateMissingMember(error);
  }
}

async function guardWorkspaceCreator(
  workspaceId: string,
  userId: string,
): Promise<void> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });

  if (workspace?.ownerId === userId) {
    throw new ApiError(
      409,
      "This workspace belongs to the person who created it — they stay an admin of it",
    );
  }
}

function translateMissingMember(error: unknown): unknown {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return new ApiError(404, "They are not in this workspace");
  }

  return error;
}
