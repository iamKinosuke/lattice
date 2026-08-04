"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  hint?: string;
  error?: string;
  trailing?: ReactNode;
  id?: string;
};

export function TextField({
  label,
  hint,
  error,
  trailing,
  id: idProp,
  required,
  className,
  ...input
}: TextFieldProps) {
  const generated = useId();
  const id = idProp ?? generated;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="text-danger-text ml-0.5" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      <div className="relative">
        <input
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-11 w-full rounded-md border bg-surface px-3 text-[1rem] text-ink",
            "placeholder:text-ink-subtle transition-colors duration-150",
            "disabled:cursor-not-allowed disabled:bg-raised disabled:opacity-60",
            error ? "border-danger" : "border-line hover:border-line-strong",
            trailing ? "pr-12" : null,
            className,
          )}
          {...input}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center">
            {trailing}
          </div>
        ) : null}
      </div>

      {hint ? (
        <p id={hintId} className="text-[0.8125rem] text-ink-subtle">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-[0.8125rem] font-medium text-danger-text"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordField(props: Omit<TextFieldProps, "type" | "trailing">) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="flex h-11 w-11 items-center justify-center rounded-md text-ink-subtle transition-colors hover:text-ink cursor-pointer"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1.5 10S4.5 4.5 10 4.5S18.5 10 18.5 10S15.5 15.5 10 15.5S1.5 10 1.5 10Z" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8.2 4.7A7.6 7.6 0 0 1 10 4.5c5.5 0 8.5 5.5 8.5 5.5a15 15 0 0 1-1.9 2.6" />
      <path d="M13.3 13.6A7.4 7.4 0 0 1 10 15.5C4.5 15.5 1.5 10 1.5 10a15 15 0 0 1 3.6-4.2" />
      <path d="M8.2 8.2a2.5 2.5 0 0 0 3.5 3.5" />
      <path d="M2.5 2.5l15 15" />
    </svg>
  );
}
