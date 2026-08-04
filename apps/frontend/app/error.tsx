"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import { StatusPage } from "@/components/app/status-page";
import { Button, ButtonLink } from "@/components/ui/button";

export default function AppError({
  error,
  unstable_retry,
  reset,
}: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <StatusPage
      icon={TriangleAlert}
      title="This page did not load"
      body="Something failed while rendering it. Trying again re-fetches the page, which is often all it needs."
    >
      {retry ? (
        <Button variant="secondary" onClick={() => retry()}>
          Try again
        </Button>
      ) : null}
      <ButtonLink href="/" variant="ghost">
        Back to Lattice
      </ButtonLink>
    </StatusPage>
  );
}
