"use client";

import { ChevronDown } from "lucide-react";
import { useId, type ReactNode, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type Size = "sm" | "md";

const SIZES: Record<
  Size,
  { control: string; arrow: string; icon: number }
> = {
  sm: { control: "h-9 pl-2.5 pr-8 text-sm", arrow: "right-2.5", icon: 16 },
  md: { control: "h-11 pl-3 pr-9 text-base", arrow: "right-3", icon: 18 },
};

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "id" | "size"
> & {
  label?: string;
  hint?: string;
  size?: Size;
  id?: string;
  children: ReactNode;
};

export function Select({
  label,
  hint,
  size = "md",
  id: idProp,
  className,
  children,
  ...select
}: SelectProps) {
  const generated = useId();
  const id = idProp ?? generated;
  const hintId = `${id}-hint`;
  const { control, arrow, icon } = SIZES[size];

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <select
          id={id}
          aria-describedby={hint ? hintId : undefined}
          className={cn(
            "peer w-full cursor-pointer appearance-none rounded-md border",
            "border-line bg-surface text-ink transition-colors duration-150",
            "hover:border-line-strong",
            "disabled:cursor-not-allowed disabled:bg-raised disabled:opacity-60",
            control,
            className,
          )}
          {...select}
        >
          {children}
        </select>

        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 flex items-center",
            "text-ink-subtle peer-disabled:opacity-60",
            arrow,
          )}
        >
          <ChevronDown size={icon} strokeWidth={2} />
        </span>
      </div>

      {hint ? (
        <p id={hintId} className="text-[0.8125rem] text-ink-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
