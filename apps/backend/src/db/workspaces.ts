import type { Workspace } from "@lattice/shared";

import { prisma } from "./prisma.js";

export async function listWorkspacesForUser(
  userId: string,
): Promise<Workspace[]> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: {
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
    },
  });

  return memberships.map(({ role, workspace }) => ({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    role,
    memberCount: workspace._count.members,
    createdAt: workspace.createdAt.toISOString(),
  }));
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
