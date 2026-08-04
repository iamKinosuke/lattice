import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app/app-header";
import { WorkspaceMembersView } from "@/components/workspace/workspace-members-view";

export const metadata: Metadata = {
  title: "Members",
};

const WORKSPACE_ID = /^[0-9a-fA-F-]{36}$/;

export default async function WorkspaceMembersPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  if (!WORKSPACE_ID.test(workspaceId)) notFound();

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-page">
      <AppHeader />
      <WorkspaceMembersView workspaceId={workspaceId} />
    </div>
  );
}
