import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BoardWorkspace } from "@/components/board/board-workspace";

export const metadata: Metadata = {
  title: "Board",
};

const BOARD_ID = /^[A-Za-z0-9_-]{1,64}$/;

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;

  if (!BOARD_ID.test(boardId)) notFound();

  return <BoardWorkspace boardId={boardId} />;
}
