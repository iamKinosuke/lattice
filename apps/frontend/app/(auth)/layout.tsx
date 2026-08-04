import Link from "next/link";

import { Logo, Wordmark } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:grid lg:grid-cols-[1fr_minmax(28rem,34rem)]">
      <aside className="relative hidden overflow-hidden bg-sunken p-12 text-ink lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(var(--lat-line) 1px, transparent 1px), linear-gradient(90deg, var(--lat-line) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--lat-brand)" }}
        />

        <Link
          href="/"
          className="relative z-10 inline-flex w-fit rounded-md text-ink"
        >
          <Wordmark />
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight text-ink">
            One canvas.
            <br />
            Many cursors.
          </h2>
          <p className="mt-5 text-[1rem] leading-relaxed text-ink-muted">
            Lattice is a collaborative whiteboard whose sync server is part of the
            project, not a service it rents. Edits merge as a lattice join — so
            they converge no matter what order they arrive in, and no server has to
            decide who was first.
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {[
              "Self-hosted CRDT sync over WebSocket",
              "Cursors and selection broadcast, never stored",
              "Boards restored exactly from the last snapshot",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <Logo className="mt-0.5 h-4 w-4 shrink-0 text-brand-text" />
                <span className="text-sm leading-relaxed text-ink-muted">
                  {line}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[0.8125rem] text-ink-subtle">
          Yjs · Express · MySQL · Konva · one EC2 box
        </p>
      </aside>

      <main className="flex flex-1 flex-col justify-center bg-base px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="mb-10 inline-flex rounded-md text-ink lg:hidden"
          >
            <Wordmark />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
