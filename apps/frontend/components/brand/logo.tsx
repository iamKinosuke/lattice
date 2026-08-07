import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 4 13.5 2 15.5 13.5 4 15.5Z" />
      <path d="M10.5 8.5 22 10.5 20 22 8.5 20Z" />
      <path
        d="M10.5 8.5 14.76 9.24 15.5 13.5 9.24 14.76Z"
        fill="currentColor"
      />
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
      <Logo className={cn("h-8 w-8 text-brand", markClassName)} />
      <span className="font-display text-lg font-semibold tracking-tight">
        Lattice
      </span>
    </span>
  );
}
