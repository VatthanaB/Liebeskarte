"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFocusTrap } from "@/lib/useFocusTrap";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmRequest = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(
  null
);

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const requestRef = useRef<ConfirmRequest | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      requestRef.current?.resolve(false);
      const next = { ...options, resolve };
      requestRef.current = next;
      setRequest(next);
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    requestRef.current?.resolve(value);
    requestRef.current = null;
    setRequest(null);
  }, []);

  useEffect(() => {
    return () => {
      requestRef.current?.resolve(false);
      requestRef.current = null;
    };
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <ConfirmDialog
          title={request.title}
          description={request.description}
          confirmLabel={request.confirmLabel}
          cancelLabel={request.cancelLabel}
          danger={request.danger}
          onCancel={() => settle(false)}
          onConfirm={() => settle(true)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onCancel,
  onConfirm,
}: ConfirmOptions & {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onCancel);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onCancel();
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onCancel]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[2100] flex items-end justify-center md:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Cancel"
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={description ? "confirm-description" : undefined}
        tabIndex={-1}
        className="relative z-10 w-full max-h-[70vh] overflow-y-auto rounded-t-xl border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lg outline-none md:max-w-md md:rounded-xl md:pb-5"
        style={{
          borderColor: "var(--theme-border)",
          backgroundColor: "var(--theme-surface)",
          color: "var(--theme-ink)",
        }}
      >
        <h2
          id="confirm-title"
          className="text-xl font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
        {description && (
          <p
            id="confirm-description"
            className="mt-2 text-sm leading-snug"
            style={{ color: "var(--theme-ink-muted)" }}
          >
            {description}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-full border px-5 text-sm font-medium"
            style={{
              borderColor: "var(--theme-border)",
              color: "var(--theme-ink)",
              fontFamily: "var(--font-label)",
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-white"
            style={{
              backgroundColor: danger ? "#dc2626" : "var(--theme-accent)",
              fontFamily: "var(--font-label)",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
