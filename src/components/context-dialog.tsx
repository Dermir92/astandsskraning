"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

// The native modal makes the rest of the page inert and supports Escape.
// Explicit Tab wrapping also keeps focus inside long, scrollable sheets.
export function ContextDialog({
  title,
  onClose,
  children,
  closeLabel = "Loka yfirliti",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  closeLabel?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current!;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      // Native close restores focus before the queued React onClose cleanup.
      // Preserve a subsequent keyboard/focus move outside the closed dialog.
      const current = document.activeElement;
      if (current instanceof HTMLElement && current.isConnected &&
        current !== document.body && current !== document.documentElement &&
        !dialog.contains(current) && current.getClientRects().length) return;
      if (
        trigger instanceof HTMLElement &&
        trigger.isConnected &&
        trigger.getClientRects().length
      )
        trigger.focus({ preventScroll: true });
      else document.getElementById("main")?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="context-dialog"
      aria-labelledby={titleId}
      onClose={(event) => {
        // Strict Mode may close and reopen the same native dialog during setup.
        if (!event.currentTarget.open) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
          ),
        ).filter((element) => element.getClientRects().length);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <div className="context-dialog-header">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          aria-label={closeLabel}
          onClick={() => dialogRef.current?.close()}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="context-dialog-content">{children}</div>
    </dialog>
  );
}
