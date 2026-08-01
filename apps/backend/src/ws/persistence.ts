import * as Y from "yjs";

import { prisma } from "../db/prisma.js";

export async function loadSnapshot(
  boardId: string,
): Promise<Uint8Array | null> {
  const snapshot = await prisma.boardSnapshot.findUnique({
    where: { boardId },
    select: { state: true },
  });

  return snapshot?.state ?? null;
}

export async function saveSnapshot(boardId: string, doc: Y.Doc): Promise<void> {
  const state = Buffer.from(Y.encodeStateAsUpdate(doc));
  const now = new Date();

  await prisma.$transaction([
    prisma.boardSnapshot.upsert({
      where: { boardId },
      create: { boardId, state },
      update: { state },
    }),
    prisma.board.update({
      where: { id: boardId },
      data: { updatedAt: now },
    }),
  ]);
}
