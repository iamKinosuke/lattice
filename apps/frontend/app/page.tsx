import Link from "next/link";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { Logo, Wordmark } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

const BUILT = [
  {
    title: "Sync that is written, not rented",
    body: "The Yjs wire protocol is implemented against y-protocols in apps/backend/src/ws — handshake, awareness framing and room lifecycle are project code, not a hosted service.",
  },
  {
    title: "Edits converge in any order",
    body: "CRDTs form a join-semilattice, and merging replicas is the lattice join: commutative, associative, idempotent. No server has to decide who moved the rectangle first.",
  },
  {
    title: "Boards survive a restart",
    body: "One Y.Doc per board, loaded from MySQL on the first join and evicted after the last client leaves. Stop the server mid-drawing and the board comes back.",
  },
];

const STATE = [
  {
    kind: "Shape data",
    home: "Y.Doc",
    body: "Has to merge across clients, so it never enters React state.",
  },
  {
    kind: "Tool and zoom",
    home: "Zustand",
    body: "Local to your own window. Never synced, never persisted.",
  },
  {
    kind: "Cursors",
    home: "Yjs awareness",
    body: "Ephemeral by design — broadcast to peers, never written to MySQL.",
  },
];

export default function RootPage() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-base">
      <header className="sticky top-0 z-30 border-b border-line bg-base/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="rounded-md text-ink">
            <Wordmark />
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ButtonLink href="/login" variant="ghost" size="sm">
              Sign in
            </ButtonLink>
            <ButtonLink href="/register" size="sm">
              Create account
            </ButtonLink>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-line">
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
            className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full opacity-20 blur-3xl"
            style={{ background: "var(--lat-brand)" }}
          />

          <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-xs font-medium text-ink-muted backdrop-blur">
                <Logo className="h-3.5 w-3.5 text-brand" />
                Self-hosted realtime, no collaboration SaaS
              </span>

              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-6xl">
                A whiteboard that
                <br />
                owns its sync server.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
                Many people drawing on one canvas at the same time. The realtime
                layer — CRDT merge, presence, persistence — is part of this
                project rather than a service it pays for.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <ButtonLink href="/register">Start a board</ButtonLink>
                <ButtonLink href="/login" variant="secondary">
                  Sign in
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
            What is actually built
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {BUILT.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-line bg-surface p-5 shadow-sm"
              >
                <Logo className="h-5 w-5 text-brand" />
                <h3 className="mt-4 font-display text-[1rem] font-semibold tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-line bg-sunken">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
              Three kinds of state, kept apart
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
              Conflating them is what makes a collaborative canvas feel janky. A
              drag writes straight to the Konva node and commits to the CRDT on
              release, so no network round trip sits inside the drag loop.
            </p>

            <dl className="mt-8 grid gap-4 sm:grid-cols-3">
              {STATE.map((item) => (
                <div
                  key={item.kind}
                  className="rounded-xl border border-line bg-base p-5"
                >
                  <dt className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-ink">
                      {item.kind}
                    </span>
                    <code className="rounded bg-brand-wash px-1.5 py-0.5 text-xs font-medium text-brand-text">
                      {item.home}
                    </code>
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {item.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-ink-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Yjs · Express · MySQL · Konva · one EC2 box</span>
          <Link href="/login" className="w-fit text-ink-muted hover:text-ink">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
