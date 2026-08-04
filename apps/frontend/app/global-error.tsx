"use client";

import { THEME_BOOTSTRAP } from "@/lib/theme";

const STYLES = `
  :root { --bg: #f7f7f8; --surface: #ffffff; --line: #e3e3e7; --ink: #18181b; --muted: #52525b; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) { --bg: #101014; --surface: #18181d; --line: #2a2a33; --ink: #ececef; --muted: #a1a1aa; }
  }
  [data-theme="dark"] { --bg: #101014; --surface: #18181d; --line: #2a2a33; --ink: #ececef; --muted: #a1a1aa; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100dvh; display: flex; align-items: center; justify-content: center;
    padding: 1.5rem; background: var(--bg); color: var(--ink);
    font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.5;
  }
  .card { max-width: 26rem; text-align: center; }
  h1 { margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 600; letter-spacing: -0.01em; }
  p { margin: 0; font-size: 0.875rem; color: var(--muted); }
  button {
    margin-top: 1.25rem; padding: 0.5rem 0.875rem; cursor: pointer;
    border: 1px solid var(--line); border-radius: 0.375rem;
    background: var(--surface); color: var(--ink);
    font: inherit; font-size: 0.875rem; font-weight: 500;
  }
`;

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="en">
      <body>
        <title>Something went wrong · Lattice</title>
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />

        <div className="card">
          <h1>Lattice could not start</h1>
          <p>
            The application shell itself failed to render, so there is nothing to
            retry on this page. Reloading is the next thing to try.
          </p>
          {error.digest ? <p>Reference: {error.digest}</p> : null}
          <button type="button" onClick={() => window.location.reload()}>
            Reload Lattice
          </button>
        </div>
      </body>
    </html>
  );
}
