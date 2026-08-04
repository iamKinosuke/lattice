"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { PasswordField, TextField } from "@/components/ui/text-field";
import { ApiClientError, api } from "@/lib/api";

type Mode = "login" | "register";
type Field = "name" | "email" | "password";

const FIELD_IDS: Record<Field, string> = {
  name: "lattice-name",
  email: "lattice-email",
  password: "lattice-password",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COPY = {
  login: {
    heading: "Sign in",
    subheading: "Pick up wherever you left the board.",
    submit: "Sign in",
    switchPrompt: "New here?",
    switchLabel: "Create an account",
    switchHref: "/register",
  },
  register: {
    heading: "Create your account",
    subheading: "You get a personal workspace to start drawing in.",
    submit: "Create account",
    switchPrompt: "Already have an account?",
    switchLabel: "Sign in",
    switchHref: "/login",
  },
} satisfies Record<Mode, Record<string, string>>;

export function AuthForm({ mode, next }: { mode: Mode; next: string }) {
  const router = useRouter();
  const copy = COPY[mode];

  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fields: Field[] =
    mode === "register" ? ["name", "email", "password"] : ["email", "password"];

  function validate(field: Field, source = values): string | undefined {
    const value = source[field].trim();

    if (field === "name") {
      if (!value) return "Name is required";
      if (value.length > 120) return "Name must be at most 120 characters";
      return undefined;
    }

    if (field === "email") {
      if (!value) return "Email is required";
      if (!EMAIL_PATTERN.test(value)) return "Must be a valid email address";
      return undefined;
    }

    if (!source.password) return "Password is required";
    if (mode === "register" && source.password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (mode === "register" && source.password.length > 72) {
      return "Password must be at most 72 characters";
    }

    return undefined;
  }

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
    if (formError) setFormError(null);
  }

  function checkOnBlur(field: Field) {
    const message = validate(field);
    if (message) setErrors((current) => ({ ...current, [field]: message }));
  }

  function focusFirstError(found: Partial<Record<Field, string>>) {
    const first = fields.find((field) => found[field]);
    if (first) document.getElementById(FIELD_IDS[first])?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const found: Partial<Record<Field, string>> = {};
    for (const field of fields) {
      const message = validate(field);
      if (message) found[field] = message;
    }

    if (Object.keys(found).length > 0) {
      setErrors(found);
      focusFirstError(found);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      if (mode === "register") {
        await api.register({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
        });
      } else {
        await api.login({
          email: values.email.trim(),
          password: values.password,
        });
      }

      router.replace(next);
    } catch (cause) {
      setSubmitting(false);
      applyError(cause, { setErrors, setFormError, focusFirstError, fields });
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        {copy.heading}
      </h1>
      <p className="mt-2 text-base text-ink-muted">{copy.subheading}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-md border border-danger/40 bg-danger-wash px-3.5 py-3 text-sm text-danger-text"
          >
            <WarningIcon />
            <span>{formError}</span>
          </div>
        ) : null}

        {mode === "register" ? (
          <TextField
            id={FIELD_IDS.name}
            label="Name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Ada Lovelace"
            value={values.name}
            error={errors.name}
            onChange={(event) => update("name", event.target.value)}
            onBlur={() => checkOnBlur("name")}
          />
        ) : null}

        <TextField
          id={FIELD_IDS.email}
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="you@example.com"
          value={values.email}
          error={errors.email}
          onChange={(event) => update("email", event.target.value)}
          onBlur={() => checkOnBlur("email")}
        />

        <PasswordField
          id={FIELD_IDS.password}
          label="Password"
          name="password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          required
          placeholder="••••••••"
          hint={mode === "register" ? "At least 8 characters." : undefined}
          value={values.password}
          error={errors.password}
          onChange={(event) => update("password", event.target.value)}
          onBlur={() => checkOnBlur("password")}
        />

        <Button type="submit" loading={submitting} className="mt-1 w-full">
          {submitting ? "Working…" : copy.submit}
        </Button>
      </form>

      <p className="mt-8 text-base text-ink-muted">
        {copy.switchPrompt}{" "}
        <Link
          href={switchHref(copy.switchHref, next)}
          className="font-medium text-brand-text underline decoration-brand-text/30 underline-offset-2 transition-colors hover:decoration-brand-text"
        >
          {copy.switchLabel}
        </Link>
      </p>
    </div>
  );
}

function switchHref(base: string, next: string): string {
  if (next === "/dashboard") return base;

  return `${base}?next=${encodeURIComponent(next)}`;
}

function applyError(
  cause: unknown,
  handlers: {
    setErrors: (next: Partial<Record<Field, string>>) => void;
    setFormError: (next: string) => void;
    focusFirstError: (found: Partial<Record<Field, string>>) => void;
    fields: Field[];
  },
) {
  if (!(cause instanceof ApiClientError)) {
    handlers.setFormError("Something went wrong. Please try again.");
    return;
  }

  if (cause.status === 422 && cause.details) {
    const found: Partial<Record<Field, string>> = {};

    for (const field of handlers.fields) {
      const message = cause.fieldError(field);
      if (message) found[field] = message;
    }

    if (Object.keys(found).length > 0) {
      handlers.setErrors(found);
      handlers.focusFirstError(found);
    }

    const bodyError = cause.fieldError("body");
    if (bodyError) handlers.setFormError(bodyError);
    else if (Object.keys(found).length === 0) handlers.setFormError(cause.message);

    return;
  }

  if (cause.status === 409) {
    handlers.setErrors({ email: cause.message });
    handlers.focusFirstError({ email: cause.message });
    return;
  }

  handlers.setFormError(cause.message);
}

function WarningIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      className="mt-0.5 shrink-0"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6.5v4.2" />
      <path d="M10 13.6h.01" />
    </svg>
  );
}
