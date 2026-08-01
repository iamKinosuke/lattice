import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 5.6 6.1 10.4M12 5.6l5.9 4.8M6.1 13.6 12 18.4M17.9 13.6 12 18.4" />
      </g>
      <circle cx="12" cy="4" r="2" fill="currentColor" />
      <circle cx="4.5" cy="12" r="2" fill="currentColor" />
      <circle cx="19.5" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="20" r="2" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Logo className={cn("h-6 w-6 text-brand", markClassName)} />
      <span className="font-display text-lg font-semibold tracking-tight">
        Lattice
      </span>
    </span>
  );
}
