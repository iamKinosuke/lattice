"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const node = ref.current;
    if (node && !node.open) node.showModal();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[calc(100vw-2rem)] max-w-md rounded-xl border border-line bg-surface p-0 text-ink shadow-lg backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1.5">
          <h2
            id={titleId}
            className="font-display text-lg font-semibold tracking-tight text-ink"
          >
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="text-sm leading-relaxed text-ink-muted">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </dialog>
  );
}
