"use client";

interface DataErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function DataErrorBanner({ message, onRetry, onDismiss }: DataErrorBannerProps) {
  return (
    <div
      role="alert"
      className="pointer-events-auto mx-auto mb-6 flex max-w-3xl flex-wrap items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm"
      style={{
        borderColor: "var(--theme-border)",
        backgroundColor: "var(--theme-surface)",
        color: "var(--theme-ink)",
      }}
    >
      <p className="min-w-0 flex-1 leading-snug">{message}</p>
      <div className="flex shrink-0 items-center gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 rounded-full px-4 py-2 text-xs font-medium text-white"
            style={{ backgroundColor: "var(--theme-accent)" }}
          >
            Try again
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-11 rounded-full border px-4 py-2 text-xs font-medium"
            style={{ borderColor: "var(--theme-border)" }}
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
