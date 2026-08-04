"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import type { BoardMember } from "@lattice/shared";

import { MemberRow } from "@/components/share/member-list";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { Spinner } from "@/components/ui/spinner";
import { TextField } from "@/components/ui/text-field";
import { ApiClientError, api } from "@/lib/api";

export function BoardShareDialog({
  open,
  boardId,
  boardTitle,
  onClose,
}: {
  open: boolean;
  boardId: string;
  boardTitle: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <SharePanel boardId={boardId} boardTitle={boardTitle} onClose={onClose} />
  );
}

function SharePanel({
  boardId,
  boardTitle,
  onClose,
}: {
  boardId: string;
  boardTitle: string;
  onClose: () => void;
}) {
  const [members, setMembers] = useState<BoardMember[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    api
      .boardMembers(boardId, controller.signal)
      .then(({ members: next }) => setMembers(next))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;

        setLoadError(
          cause instanceof ApiClientError
            ? cause.message
            : "Could not load who this board is shared with.",
        );
      });

    return () => controller.abort();
  }, [boardId]);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (adding) return;

    const trimmed = email.trim();
    if (!trimmed) {
      setAddError("Enter an email address");
      return;
    }

    setAdding(true);
    setAddError(null);

    try {
      const member = await api.addBoardMember(boardId, {
        email: trimmed,
        role: "editor",
      });

      setMembers((current) => [...(current ?? []), member]);
      setEmail("");
    } catch (cause) {
      setAddError(
        cause instanceof ApiClientError
          ? (cause.fieldError("email") ?? cause.message)
          : "Could not share this board.",
      );
    } finally {
      setAdding(false);
    }
  }

  async function remove(member: BoardMember) {
    setBusyUserId(member.userId);
    setAddError(null);

    try {
      await api.removeBoardMember(boardId, member.userId);
      setMembers((current) =>
        (current ?? []).filter((row) => row.userId !== member.userId),
      );
    } catch (cause) {
      setAddError(
        cause instanceof ApiClientError
          ? cause.message
          : "Could not remove them.",
      );
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Share this board"
      description={`People you add here reach ${boardTitle} and nothing else in the workspace.`}
    >
      <form onSubmit={add} noValidate className="flex flex-col gap-3">
        <TextField
          label="Invite by email"
          type="email"
          autoComplete="off"
          inputMode="email"
          placeholder="teammate@example.com"
          hint="They need a Lattice account already — no email is sent."
          value={email}
          error={addError ?? undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            if (addError) setAddError(null);
          }}
        />

        <Button type="submit" loading={adding} className="self-start">
          {adding ? "Sharing…" : "Share"}
        </Button>
      </form>

      <div className="border-t border-line pt-1">
        {loadError ? (
          <p role="alert" className="py-3 text-sm text-danger-text">
            {loadError}
          </p>
        ) : members === null ? (
          <p className="flex items-center gap-2 py-3 text-sm text-ink-muted">
            <Spinner />
            Loading…
          </p>
        ) : members.length === 0 ? (
          <p className="py-3 text-sm text-ink-muted">
            Nobody outside the workspace has this board yet.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {members.map((member) => (
              <MemberRow
                key={member.userId}
                name={member.name}
                email={member.email}
                avatarUrl={member.avatarUrl}
              >
                <IconButton
                  label={`Remove ${member.name}`}
                  disabled={busyUserId === member.userId}
                  onClick={() => void remove(member)}
                >
                  <Trash2 size={18} strokeWidth={1.75} aria-hidden />
                </IconButton>
              </MemberRow>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Done
        </Button>
      </div>
    </Dialog>
  );
}
