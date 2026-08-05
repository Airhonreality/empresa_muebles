"use client";

import { type ReactNode, useEffect } from "react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/* Primitiva Modal (A4 #2). Motion real (entrada/salida) sobre propiedades
   compositor-only (opacity, translateY). Focus trap básico (tablero de
   a11y). Overlay z-index token (`z-modal`). backdrop-token (`overlay-backdrop`). */
export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const first = document.querySelector<HTMLElement>(
      '[data-modal-content] button, [data-modal-content] input, [data-modal-content] button'
    );
    first?.focus();
    return () => {
      prev?.focus();
    };
  }, [open]);

  useEffect((/* cmd/enter-to-close intent */) => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
      <div
        aria-modal="true"
        role="dialog"
        aria-label={title}
        className="fixed inset-0 z-modal flex items-center justify-center bg-overlay-backdrop p-4"
        onClick={onClose}
      >
        <div
          data-modal-content
          role="document"
          className="w-full max-w-lg animate-slide-in rounded-lg border border-border-subtle bg-bg-raised p-6 shadow-xl duration-200 ease-out"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-text-heading">{title}</h2>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={onClose}
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-sm text-text-muted hover:text-text-heading"
            >
              ✕
            </button>
        </header>
        {children}
      </div>
    </div>
  );
}
