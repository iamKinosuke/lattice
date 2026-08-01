import type { Metadata } from "next";

import type { BoardFilter } from "@lattice/shared";

import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Boards",
};

const FILTERS: BoardFilter[] = ["recent", "owned", "shared", "favorites"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string | string[]; workspaceId?: string | string[] }>;
}) {
  const params = await searchParams;

  return (
    <DashboardView
      initialFilter={parseFilter(params.filter)}
      initialWorkspaceId={parseId(params.workspaceId)}
    />
  );
}

function parseFilter(value: string | string[] | undefined): BoardFilter {
  const candidate = Array.isArray(value) ? value[0] : value;

  return FILTERS.includes(candidate as BoardFilter)
    ? (candidate as BoardFilter)
    : "recent";
}

function parseId(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && candidate.length > 0 ? candidate : null;
}
