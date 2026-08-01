"use client";

import { useState, type FormEvent } from "react";

import type { Board } from "@lattice/shared";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { ApiClientError, api } from "@/lib/api";

export function RenameBoardDialog({
  board,
  onClose,
  onRenamed,
}: {
  board: Board | null;
  onClose: () => void;
  onRenamed: (board: Board) => void;
}) {
  if (!board) return null;

  return (
    <RenameForm
      key={board.id}
      board={board}
      onClose={onClose}
      onRenamed={onRenamed}
    />
  );
}

function RenameForm({
  board,
  onClose,
  onRenamed,
}: {
  board: Board;
  onClose: () => void;
  onRenamed: (board: Board) => void;
}) {
  const [title, setTitle] = useState(board.title);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const next = title.trim();

    if (!next) {
      setError("Title is required");
      return;
    }
    if (next === board.title) {
      onClose();
      return;
    }

    setSaving(true);
    setError(undefined);

    try {
      const updated = await api.renameBoard(board.id, { title: next });
      onRenamed(updated);
      onClose();
    } catch (cause) {
      setSaving(false);
      setError(
        cause instanceof ApiClientError
          ? (cause.fieldError("title") ?? cause.message)
          : "Could not rename the board.",
      );
    }
  }

  return (
    <Dialog open onClose={onClose} title="Rename board">
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <TextField
          label="Title"
          autoFocus
          maxLength={255}
          value={title}
          error={error}
          onChange={(event) => {
            setTitle(event.target.value);
            if (error) setError(undefined);
          }}
        />

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function DeleteBoardDialog({
  board,
  onClose,
  onDeleted,
}: {
  board: Board | null;
  onClose: () => void;
  onDeleted: (boardId: string) => void;
}) {
  if (!board) return null;

  return (
    <DeleteConfirm
      key={board.id}
      board={board}
      onClose={onClose}
      onDeleted={onDeleted}
    />
  );
}

function DeleteConfirm({
  board,
  onClose,
  onDeleted,
}: {
  board: Board;
  onClose: () => void;
  onDeleted: (boardId: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    if (deleting) return;

    setDeleting(true);
    setError(null);

    try {
      await api.deleteBoard(board.id);
      onDeleted(board.id);
      onClose();
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.status === 404) {
        onDeleted(board.id);
        onClose();
        return;
      }

      setDeleting(false);
      setError(
        cause instanceof ApiClientError
          ? cause.message
          : "Could not delete the board.",
      );
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Delete this board?"
      description={`“${board.title}” and everything drawn on it will be removed. This cannot be undone.`}
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p role="alert" className="text-sm font-medium text-danger-text">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm} loading={deleting}>
            Delete board
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
