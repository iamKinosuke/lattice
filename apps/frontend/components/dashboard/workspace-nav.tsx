"use client";

import { LayoutGrid, Lock, Settings2, Users } from "lucide-react";
import Link from "next/link";

import type { Workspace } from "@lattice/shared";

import { cn } from "@/lib/cn";

export type WorkspaceScope = string | null;

export function WorkspaceSidebar({
  workspaces,
  loading,
  value,
  onChange,
}: {
  workspaces: Workspace[];
  loading: boolean;
  value: WorkspaceScope;
  onChange: (next: WorkspaceScope) => void;
}) {
  return (
    <nav
      aria-label="Workspaces"
      className="hidden w-60 shrink-0 flex-col gap-1 lg:flex"
    >
      <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        Workspaces
      </p>

      <ScopeButton
        active={value === null}
        onClick={() => onChange(null)}
        icon={<LayoutGrid size={18} strokeWidth={1.75} aria-hidden />}
        label="All boards"
      />

      {loading
        ? [0, 1].map((key) => (
            <div key={key} className="h-9 animate-pulse rounded-md bg-raised" />
          ))
        : workspaces.map((workspace) => (
            <div key={workspace.id} className="flex items-center gap-0.5">
              <ScopeButton
                active={value === workspace.id}
                onClick={() => onChange(workspace.id)}
                icon={
                  workspace.memberCount > 1 ? (
                    <Users size={18} strokeWidth={1.75} aria-hidden />
                  ) : (
                    <Lock size={18} strokeWidth={1.75} aria-hidden />
                  )
                }
                label={workspace.name}
                meta={
                  workspace.memberCount > 1
                    ? `${workspace.memberCount}`
                    : undefined
                }
              />

              <Link
                href={`/workspace/${workspace.id}/members`}
                aria-label={`Manage ${workspace.name}`}
                title="Manage members"
                className="flex h-9 w-8 shrink-0 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-raised hover:text-ink"
              >
                <Settings2 size={18} strokeWidth={1.75} aria-hidden />
              </Link>
            </div>
          ))}
    </nav>
  );
}

function ScopeButton({
  active,
  onClick,
  icon,
  label,
  meta,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  meta?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-md px-3 text-sm transition-colors duration-150",
        active
          ? "bg-raised font-medium text-ink"
          : "text-ink-muted hover:bg-raised hover:text-ink",
      )}
    >
      <span className={active ? "text-brand-text" : "text-ink-subtle"}>{icon}</span>
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {meta ? (
        <span className="tabular shrink-0 text-xs text-ink-subtle">{meta}</span>
      ) : null}
    </button>
  );
}

export function WorkspaceSelect({
  workspaces,
  value,
  onChange,
}: {
  workspaces: Workspace[];
  value: WorkspaceScope;
  onChange: (next: WorkspaceScope) => void;
}) {
  const selectId = "workspace-scope";

  return (
    <div className="flex flex-col gap-1.5 lg:hidden">
      <label htmlFor={selectId} className="text-sm font-medium text-ink">
        Workspace
      </label>
      <select
        id={selectId}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className="h-11 w-full cursor-pointer rounded-md border border-line bg-surface px-3 text-base text-ink"
      >
        <option value="">All boards</option>
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </select>
    </div>
  );
}
