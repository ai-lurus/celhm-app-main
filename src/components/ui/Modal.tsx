"use client";

import { ReactNode, useEffect, useId } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Disables Escape/backdrop-click while a save is in flight, matching ConfirmDialog's isLoading guard. */
  closeDisabled?: boolean;
  labelledBy?: string;
  maxWidth?: string;
}

/**
 * Shared overlay + panel for the app's form modals: Escape key and backdrop
 * click both close it, and the panel carries role="dialog"/aria-modal so
 * screen readers announce it. Mirrors the pattern already used in
 * ConfirmDialog, plus backdrop-click which that one doesn't have.
 */
export function Modal({
  isOpen,
  onClose,
  children,
  closeDisabled = false,
  labelledBy,
  maxWidth = "max-w-md",
}: ModalProps) {
  const generatedId = useId();
  const titleId = labelledBy ?? generatedId;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closeDisabled) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeDisabled, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (closeDisabled) return;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-card p-6 rounded-lg shadow-2xl w-full ${maxWidth}`}
      >
        {children}
      </div>
    </div>
  );
}
