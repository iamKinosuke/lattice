import { randomBytes } from "node:crypto";

import type { PublicUser } from "@lattice/shared";

import { ApiError } from "../lib/api-error.js";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "./prisma.js";

type UserRow = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

export function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  };
}

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, avatarUrl: true },
  });
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      passwordHash: true,
    },
  });
}

export async function createUserWithPersonalWorkspace(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<PublicUser> {
  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash: input.passwordHash,
        },
        select: { id: true, email: true, name: true, avatarUrl: true },
      });

      await tx.workspace.create({
        data: {
          name: `${input.name}'s workspace`,
          slug: personalWorkspaceSlug(input.name),
          ownerId: user.id,
          members: { create: { userId: user.id, role: "owner" } },
        },
      });

      return toPublicUser(user);
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      /email/i.test(JSON.stringify(error.meta?.target ?? ""))
    ) {
      throw new ApiError(409, "An account with that email already exists");
    }

    throw error;
  }
}

function personalWorkspaceSlug(name: string): string {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "workspace";

  return `${base}-${randomBytes(3).toString("hex")}`;
}
