"use client";

import { useEffect, useRef, useState } from "react";

import type { Board } from "@lattice/shared";

import { ApiClientError, api } from "@/lib/api";
import { cn } from "@/lib/cn";

export function BoardTitle({
  board,
  onRenamed,
}: {
  board: Board;
  onRenamed: (board: Board) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(board.title);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.select();
  }, [editing]);

  function begin() {
    setDraft(board.title);
    setError(null);
    cancelledRef.current = false;
    setEditing(true);
  }

  function cancel() {
    cancelledRef.current = true;
    setEditing(false);
    setDraft(board.title);
    setError(null);
  }

  async function commit() {
    if (cancelledRef.current || saving) return;

    const next = draft.trim();

    if (!next || next === board.title) {
      cancel();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await api.renameBoard(board.id, { title: next });
      onRenamed(updated);
      setEditing(false);
    } catch (cause) {
      setDraft(board.title);
      setError(
        cause instanceof ApiClientError
          ? (cause.fieldError("title") ?? cause.message)
          : "Could not rename.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex min-w-0 flex-col">
        <input
          ref={inputRef}
          value={draft}
          disabled={saving}
          maxLength={255}
          aria-label="Board title"
          aria-invalid={error ? true : undefined}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void commit();
            } else if (event.key === "Escape") {
              event.preventDefault();
              cancel();
            }
          }}
          className={cn(
            "h-9 w-56 rounded-md border bg-surface px-2.5 text-[0.9375rem] font-medium text-ink",
            "disabled:opacity-60",
            error ? "border-danger" : "border-brand",
          )}
        />
        {error ? (
          <span role="alert" className="mt-0.5 text-xs text-danger-text">
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col">
      <button
        type="button"
        onClick={begin}
        title="Rename board"
        className="max-w-[16rem] truncate rounded-md px-2.5 py-1.5 text-left text-[0.9375rem] font-medium text-ink transition-colors duration-150 hover:bg-raised sm:max-w-sm"
      >
        {board.title}
      </button>
      {error ? (
        <span role="alert" className="mt-0.5 px-2.5 text-xs text-danger-text">
          {error}
        </span>
      ) : null}
    </div>
  );
}
