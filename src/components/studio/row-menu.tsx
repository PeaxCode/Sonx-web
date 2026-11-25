"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { IconMore } from "@/components/icons";

/** Class for a full-width item inside RowMenu: icon, then its label. */
export const ROW_MENU_ITEM =
  "flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm text-paper/85 transition hover:bg-paper/[0.06] hover:text-paper";

/**
 * "…" button that opens a song's less-used actions as a list. Used on phones, where
 * a row has no room for every icon next to the title. The list stays mounted while
 * closed (only hidden), so a dialog an item opened, like the album picker, stays open.
 */
export function RowMenu({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-label={`More actions for ${title}`} aria-haspopup="true" aria-expanded={open} aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="rounded-full p-2 transition hover:bg-paper/10 hover:text-paper">
        <IconMore size={18} />
      </button>
      {/* Any tap on an item closes the list; the item's own action still runs. */}
      <div id={menuId} onClick={() => setOpen(false)}
        className={`absolute right-0 top-full z-30 mt-1 w-52 rounded-[16px] border border-line bg-plum p-1.5 shadow-[0_20px_40px_-12px_rgb(0_0_0/0.8)] transition ${
          open ? "visible opacity-100" : "pointer-events-none invisible opacity-0"
        }`}>
        {children}
      </div>
    </div>
  );
}
