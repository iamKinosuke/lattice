import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-page">
      <p className="flex items-center gap-2 text-sm text-ink-muted">
        <Spinner />
        Loading…
      </p>
    </div>
  );
}
