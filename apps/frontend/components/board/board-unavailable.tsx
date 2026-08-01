import { FileQuestion } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";

export function BoardUnavailable({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-base px-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-raised text-ink-subtle">
          <FileQuestion size={22} strokeWidth={1.5} aria-hidden />
        </span>

        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-ink-muted">{body}</p>
        </div>

        <ButtonLink href="/dashboard" variant="secondary" className="mt-1">
          Back to boards
        </ButtonLink>
      </div>
    </div>
  );
}
