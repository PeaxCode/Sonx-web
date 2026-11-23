"use client";

import { useEffect, useId, useRef, useState } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion";

interface ConfirmDialogProps {
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  /** When set, the confirm button stays off until this word is typed (e.g. "DELETE"). */
  typeToConfirm?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A designed replacement for window.confirm, for actions that cannot be undone. */
export function ConfirmDialog({ title, children, confirmLabel, typeToConfirm, busy, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [typed, setTyped] = useState("");
  const titleId = useId();
  const inputId = useId();
  const ready = !busy && (!typeToConfirm || typed.trim() === typeToConfirm);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.from(ref.current, { opacity: 0, duration: 0.2 });
    gsap.from(".confirm-panel", { scale: 0.96, y: 8, opacity: 0, duration: 0.25, ease: "power2.out" });
  }, { scope: ref });

  useEffect(() => {
    // Focus starts on the safe choice.
    if (!typeToConfirm) cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel, typeToConfirm]);

  return (
    <div ref={ref} role="alertdialog" aria-modal="true" aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={() => !busy && onCancel()}>
      <form className="confirm-panel w-full max-w-sm rounded-[var(--radius-panel)] border border-line bg-plum p-6"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (ready) onConfirm();
        }}>
        <h2 id={titleId} className="font-display text-xl font-semibold">{title}</h2>
        <div className="mt-3 flex flex-col gap-2 text-sm text-paper/75">{children}</div>
        {typeToConfirm && (
          <label htmlFor={inputId} className="mt-5 block text-sm">
            Type <strong className="font-mono">{typeToConfirm}</strong> to confirm
            <input id={inputId} autoFocus autoComplete="off" autoCapitalize="characters" spellCheck={false}
              value={typed} onChange={(event) => setTyped(event.target.value)}
              className="mt-2 w-full rounded-[var(--radius-control)] border border-line bg-night px-4 py-2.5 font-mono focus:border-paper/40 focus:outline-none" />
          </label>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-paper/80 transition hover:bg-paper/10 hover:text-paper disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={!ready}
            className="rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-paper transition hover:brightness-110 disabled:opacity-40">
            {busy ? "Working" : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
