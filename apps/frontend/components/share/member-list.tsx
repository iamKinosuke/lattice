import type { ReactNode } from "react";

export function MemberAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-raised text-sm font-semibold text-ink-muted">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        name.trim().charAt(0).toUpperCase() || "?"
      )}
    </span>
  );
}

export function MemberRow({
  name,
  email,
  avatarUrl,
  note,
  children,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  note?: string;
  children?: ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <MemberAvatar name={name} avatarUrl={avatarUrl} />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">
          {name}
          {note ? (
            <span className="ml-1.5 font-normal text-ink-subtle">{note}</span>
          ) : null}
        </span>
        <span className="block truncate text-sm text-ink-muted">{email}</span>
      </span>

      {children ? (
        <span className="flex shrink-0 items-center gap-1.5">{children}</span>
      ) : null}
    </li>
  );
}
