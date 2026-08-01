import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "ghost" | "surface";

const VARIANTS: Record<Variant, string> = {
  ghost: "text-ink-subtle hover:bg-raised hover:text-ink",
  surface:
    "bg-surface/90 text-ink-muted border border-line shadow-sm backdrop-blur hover:bg-surface hover:text-ink",
};

const BASE =
  "inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors duration-150";

function classes(variant: Variant, active: boolean, className?: string): string {
  return cn(
    BASE,
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    active ? "text-brand-text hover:text-brand-text" : null,
    className,
  );
}

type Shared = {
  label: string;
  variant?: Variant;
  active?: boolean;
};

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & Shared;

export function IconButton({
  label,
  variant = "ghost",
  active = false,
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={classes(variant, active, className)}
      {...rest}
    />
  );
}

export function IconLink({
  label,
  href,
  variant = "ghost",
  active = false,
  className,
  children,
}: Shared & { href: string; className?: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={classes(variant, active, className)}
    >
      {children}
    </Link>
  );
}
