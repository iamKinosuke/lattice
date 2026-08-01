"use client";

import type { PresenceUser } from "@lattice/shared";

const VISIBLE = 4;

export function PresenceBar({
  users,
  selfId,
}: {
  users: PresenceUser[];
  selfId: string | null;
}) {
  if (users.length === 0) return null;

  const shown = users.slice(0, VISIBLE);
  const overflow = users.length - shown.length;

  return (
    <ul
      aria-label={`${users.length} ${users.length === 1 ? "person" : "people"} on this board`}
      className="flex shrink-0 items-center -space-x-2"
    >
      {shown.map((user) => (
        <li key={user.id} className="relative">
          <span
            title={user.id === selfId ? `${user.name} (you)` : user.name}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 bg-surface text-xs font-semibold text-ink"
            style={{ borderColor: user.color }}
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              user.name.trim().charAt(0).toUpperCase() || "?"
            )}
          </span>
          <span className="sr-only">
            {user.name}
            {user.id === selfId ? " (you)" : ""}
          </span>
        </li>
      ))}

      {overflow > 0 ? (
        <li className="relative">
          <span className="tabular flex h-8 w-8 items-center justify-center rounded-full border-2 border-line bg-raised text-xs font-semibold text-ink-muted">
            +{overflow}
          </span>
        </li>
      ) : null}
    </ul>
  );
}
