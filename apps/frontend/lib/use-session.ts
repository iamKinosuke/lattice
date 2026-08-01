"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { PublicUser } from "@lattice/shared";

import { ApiClientError, api } from "@/lib/api";

export function useSession(): {
  user: PublicUser | null;
  loading: boolean;
  error: string | null;
} {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    api
      .me(controller.signal)
      .then((next) => {
        setUser(next);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;

        if (cause instanceof ApiClientError && cause.status === 401) {
          router.replace("/login");
          return;
        }

        setError(
          cause instanceof ApiClientError
            ? cause.message
            : "Could not load your account.",
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [router]);

  return { user, loading, error };
}
