"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from "@lattice/shared";

import { StatusPage } from "@/components/app/status-page";
import { MemberRow } from "@/components/share/member-list";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Spinner } from "@/components/ui/spinner";
import { TextField } from "@/components/ui/text-field";
import { ApiClientError, api } from "@/lib/api";
import { useSession } from "@/lib/use-session";

const ROLES: WorkspaceRole[] = ["owner", "admin", "member"];

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; workspace: Workspace }
  | { kind: "missing" }
  | { kind: "error"; message: string };

export function WorkspaceMembersView({ workspaceId }: { workspaceId: string }) {
  const { user } = useSession();

  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [members, setMembers] = useState<WorkspaceMember[] | null>(null);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      api.workspace(workspaceId, controller.signal),
      api.workspaceMembers(workspaceId, controller.signal),
    ])
      .then(([workspace, { members: next }]) => {
        setState({ kind: "ready", workspace });
        setMembers(next);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;

        if (cause instanceof ApiClientError && cause.status === 404) {
          setState({ kind: "missing" });
          return;
        }

        setState({
          kind: "error",
          message:
            cause instanceof ApiClientError
              ? cause.message
              : "Could not load this workspace.",
        });
      });

    return () => controller.abort();
  }, [workspaceId]);

  if (state.kind === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Spinner />
          Loading workspace…
        </p>
      </div>
    );
  }

  if (state.kind === "missing") {
    return (
      <StatusPage
        icon={ArrowLeft}
        title="This workspace is not here"
        body="It may have been deleted, or you are no longer a member of it."
      />
    );
  }

  if (state.kind === "error") {
    return (
      <StatusPage
        icon={ArrowLeft}
        title="Could not open this workspace"
        body={state.message}
      />
    );
  }

  const { workspace } = state;
  const mayManage = workspace.role === "owner" || workspace.role === "admin";

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (adding) return;

    const trimmed = email.trim();
    if (!trimmed) {
      setFormError("Enter an email address");
      return;
    }

    setAdding(true);
    setFormError(null);

    try {
      const member = await api.addWorkspaceMember(workspaceId, {
        email: trimmed,
        role,
      });

      setMembers((current) => [...(current ?? []), member]);
      setEmail("");
    } catch (cause) {
      setFormError(
        cause instanceof ApiClientError
          ? (cause.fieldError("email") ?? cause.message)
          : "Could not add them.",
      );
    } finally {
      setAdding(false);
    }
  }

  async function changeRole(member: WorkspaceMember, next: WorkspaceRole) {
    setBusyUserId(member.userId);
    setActionError(null);

    try {
      const updated = await api.setWorkspaceRole(
        workspaceId,
        member.userId,
        next,
      );

      setMembers((current) =>
        (current ?? []).map((row) =>
          row.userId === updated.userId ? updated : row,
        ),
      );
    } catch (cause) {
      setActionError(
        cause instanceof ApiClientError
          ? cause.message
          : "Could not change their role.",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function remove(member: WorkspaceMember) {
    setBusyUserId(member.userId);
    setActionError(null);

    try {
      await api.removeWorkspaceMember(workspaceId, member.userId);
      setMembers((current) =>
        (current ?? []).filter((row) => row.userId !== member.userId),
      );
    } catch (cause) {
      setActionError(
        cause instanceof ApiClientError
          ? cause.message
          : "Could not remove them.",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <Link
        href={`/dashboard?workspaceId=${workspaceId}`}
        className="inline-flex items-center gap-1.5 text-base text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
        Back to boards
      </Link>

      <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-ink">
        {workspace.name}
      </h1>
      <p className="mt-2 text-base text-ink-muted">
        Everyone here can open and draw on every board in this workspace. To give
        somebody one board only, share that board from inside it.
      </p>

      {mayManage ? (
        <form
          onSubmit={add}
          noValidate
          className="mt-8 flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-start"
        >
          <div className="flex-1">
            <TextField
              label="Add by email"
              type="email"
              autoComplete="off"
              inputMode="email"
              placeholder="teammate@example.com"
              hint="They need a Lattice account already — no email is sent."
              value={email}
              error={formError ?? undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                if (formError) setFormError(null);
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="new-member-role"
              className="text-sm font-medium text-ink"
            >
              Role
            </label>
            <select
              id="new-member-role"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as WorkspaceRole)
              }
              className="h-11 cursor-pointer rounded-md border border-line bg-surface px-3 text-base text-ink"
            >
              {ROLES.filter(
                (value) => value !== "owner" || workspace.role === "owner",
              ).map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" loading={adding} className="sm:mt-7">
            {adding ? "Adding…" : "Add"}
          </Button>
        </form>
      ) : null}

      {actionError ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-danger/40 bg-danger-wash px-3.5 py-3 text-sm text-danger-text"
        >
          {actionError}
        </p>
      ) : null}

      <h2 className="font-display mt-8 text-lg font-semibold tracking-tight text-ink">
        Members
      </h2>

      {members === null ? (
        <p className="flex items-center gap-2 py-3 text-sm text-ink-muted">
          <Spinner />
          Loading…
        </p>
      ) : (
        <ul className="mt-1 divide-y divide-line">
          {members.map((member) => (
            <MemberRow
              key={member.userId}
              name={member.name}
              email={member.email}
              avatarUrl={member.avatarUrl}
              note={member.userId === user?.id ? "(you)" : undefined}
            >
              {mayManage ? (
                <select
                  aria-label={`Role for ${member.name}`}
                  value={member.role}
                  disabled={busyUserId === member.userId}
                  onChange={(event) =>
                    void changeRole(
                      member,
                      event.target.value as WorkspaceRole,
                    )
                  }
                  className="h-9 cursor-pointer rounded-md border border-line bg-surface px-2 text-sm text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {ROLES.map((value) => (
                    <option key={value} value={value}>
                      {ROLE_LABELS[value]}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-ink-muted">
                  {ROLE_LABELS[member.role]}
                </span>
              )}

              {mayManage ? (
                <IconButton
                  label={`Remove ${member.name}`}
                  disabled={busyUserId === member.userId}
                  onClick={() => void remove(member)}
                >
                  <Trash2 size={18} strokeWidth={1.75} aria-hidden />
                </IconButton>
              ) : null}
            </MemberRow>
          ))}
        </ul>
      )}
    </div>
  );
}
