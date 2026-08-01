"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import type { PublicUser } from "@lattice/shared";

import { Menu } from "@/components/ui/menu";
import { api } from "@/lib/api";

export function UserMenu({ user }: { user: PublicUser | null }) {
  const router = useRouter();

  async function signOut() {
    try {
      await api.logout();
    } finally {
      router.replace("/login");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar user={user} />

      <div className="hidden min-w-0 flex-col leading-tight sm:flex">
        <span className="truncate text-sm font-medium text-ink">
          {user?.name ?? "…"}
        </span>
        <span className="truncate text-xs text-ink-subtle">
          {user?.email ?? ""}
        </span>
      </div>

      <Menu
        label="Account menu"
        trigger={<ChevronDown size={16} strokeWidth={2} aria-hidden />}
        items={[{ label: "Sign out", icon: LogOut, onSelect: signOut }]}
      />
    </div>
  );
}

function Avatar({ user }: { user: PublicUser | null }) {
  if (user?.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-full border border-line object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-wash text-sm font-semibold text-brand-text"
    >
      {user?.name?.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
