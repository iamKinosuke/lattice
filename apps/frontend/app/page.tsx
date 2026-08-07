import Link from "next/link";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { Logo, Wordmark } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

const TOGETHER = [
  {
    title: "Nobody waits their turn",
    body: "Everyone draws at the same time. Nothing is locked while someone else is holding it, and every screen ends up showing the same board.",
  },
  {
    title: "Your undo stays yours",
    body: "Undo takes back the last thing you did — not whatever a teammate changed a second ago somewhere else on the canvas.",
  },
  {
    title: "Nothing to save",
    body: "Close the tab, lose your connection, come back tomorrow. The board is where you left it, and it reconnects on its own.",
  },
];

const CANVAS = [
  {
    title: "Draw it however you think",
    body: "Freehand pen, rectangles and ellipses, text anywhere, sticky notes wherever they belong. Recolour anything, and push it in front of or behind the rest.",
  },
  {
    title: "See what everyone is doing",
    body: "Cursors carry the name of the person moving them, and you watch a teammate's line appear as they draw it rather than after they finish.",
  },
  {
    title: "Take the board with you",
    body: "Export the canvas as an image in one click — the whole board, not just the part that happens to be on your screen.",
  },
];

export default function RootPage() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-page">
      <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur">
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
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3.5 py-1.5 text-sm font-medium text-ink-muted backdrop-blur">
                <Logo className="h-6 w-6 text-brand" />
                Runs in your browser — nothing to install
              </span>

              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-6xl">
                One whiteboard.
                <br />
                Everyone at once.
              </h1>

              <p className="mt-6 max-w-xl text-xl leading-relaxed text-ink-muted">
                Sketch, arrange and annotate with your team in the same moment.
                Cursors move as people move them, lines appear as they are drawn,
                and everybody is looking at the same board.
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
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Made for working at the same time
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {TOGETHER.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-line bg-surface p-6 shadow-sm"
              >
                <Logo className="h-8 w-8 text-brand" />
                <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-ink-muted">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-line bg-sunken">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
              Everything the canvas gives you
            </h2>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink-muted">
              Dragging stays smooth however many people are on the board, because
              your own moves are drawn the instant you make them.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {CANVAS.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-line bg-page p-6"
                >
                  <Logo className="h-8 w-8 text-brand" />
                  <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-ink-muted">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-base text-ink-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Lattice — a whiteboard for thinking together.</span>
          <Link href="/login" className="w-fit text-ink-muted hover:text-ink">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
