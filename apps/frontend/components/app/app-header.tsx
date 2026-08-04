"use client";

import Link from "next/link";

import { Wordmark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { UserMenu } from "@/components/app/user-menu";
import { useSession } from "@/lib/use-session";

export function AppHeader() {
  const { user } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/dashboard" className="rounded-md text-ink">
          <Wordmark />
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
