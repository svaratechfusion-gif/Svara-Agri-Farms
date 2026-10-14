"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  label: string;
  side?: "right" | "full";
  tone?: "light" | "dark";
  children: ReactNode;
}

/**
 * Modal drawer built on the native <dialog> element, which provides focus
 * containment, Escape-to-close and an inert page behind it.
 */
export function Drawer({
  open,
  onClose,
  label,
  side = "right",
  tone = "light",
  children,
}: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onClose]);

  const placement =
    side === "full"
      ? "inset-0 h-dvh max-h-none w-full max-w-none"
      : "inset-y-0 right-0 left-auto h-dvh max-h-none w-full max-w-md";
  const colors = tone === "dark" ? "bg-forest text-ivory" : "bg-ivory text-ink";

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      data-surface={tone}
      className={`drawer m-0 p-0 ${placement} ${colors} backdrop:bg-ink/40`}
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current.close();
      }}
    >
      <div className="relative flex h-full flex-col overflow-x-hidden overflow-y-auto overscroll-contain">
        {children}
      </div>
    </dialog>
  );
}
