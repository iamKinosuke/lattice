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
  role: true,
  workspace: {
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      _count: { select: { members: true } },
    },
  },
} as const;

type MembershipRow = {
  role: WorkspaceRole;
  workspace: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    _count: { members: number };
  };
};

function toWorkspace({ role, workspace }: MembershipRow): Workspace {
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    role,
    memberCount: workspace._count.members,
    createdAt: workspace.createdAt.toISOString(),
  };
}

export async function listWorkspacesForUser(
  userId: string,
): Promise<Workspace[]> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    orderBy: { joinedAt: "asc" },
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
} as const;

type MemberRow = {
  role: WorkspaceRole;
  joinedAt: Date;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
};

function toMember(row: MemberRow): WorkspaceMember {
  return {
    userId: row.user.id,
    name: row.user.name,
    email: row.user.email,
    avatarUrl: row.user.avatarUrl,
    role: row.role,
    joinedAt: row.joinedAt.toISOString(),
  };
}

export async function listWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const rows = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    orderBy: { joinedAt: "asc" },
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
  if (role !== "owner") {
    await guardLastOwner(workspaceId, userId);
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
  await guardLastOwner(workspaceId, userId);

  try {
    await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  } catch (error) {
    throw translateMissingMember(error);
  }
}

async function guardLastOwner(
  workspaceId: string,
  userId: string,
): Promise<void> {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });

  if (membership?.role !== "owner") return;

  const owners = await prisma.workspaceMember.count({
    where: { workspaceId, role: "owner" },
  });

  if (owners <= 1) {
    throw new ApiError(
      409,
      "A workspace must keep one owner — promote somebody else first",
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
