"use client";

interface SelectionMarkProps {
  selected: boolean;
}

export function SelectionMark({ selected }: SelectionMarkProps) {
  return (
    <span
      className="absolute left-2 top-2 z-10 flex h-11 w-11 items-center justify-start"
      aria-hidden
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-semibold leading-none shadow-sm"
        style={{
          backgroundColor: selected ? "var(--theme-accent)" : "rgba(255,255,255,0.92)",
          borderColor: selected ? "var(--theme-accent)" : "rgba(255,255,255,0.95)",
          color: selected ? "#fff" : "transparent",
        }}
      >
        ✓
      </span>
    </span>
  );
}

interface BatchSelectBarProps {
  selectedCount: number;
  visibleCount: number;
  busy: boolean;
  noun: { singular: string; plural: string };
  onSelectAll: () => void;
  onExit: () => void;
  onDelete: () => void;
}

export function BatchSelectBar({
  selectedCount,
  visibleCount,
  busy,
  noun,
  onSelectAll,
  onExit,
  onDelete,
}: BatchSelectBarProps) {
  const allSelected = visibleCount > 0 && selectedCount === visibleCount;
  const label = selectedCount === 1 ? noun.singular : noun.plural;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[1000] border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="toolbar"
      aria-label="Batch selection actions"
      style={{
        backgroundColor: "var(--theme-surface)",
        borderColor: "var(--theme-border)",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className="text-sm font-medium"
          aria-live="polite"
          style={{ fontFamily: "var(--font-label)" }}
        >
          {selectedCount} {label} selected
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={busy || visibleCount === 0}
            className="min-h-11 rounded-full border px-4 text-xs font-medium disabled:opacity-50 sm:flex-none"
            style={{
              borderColor: "var(--theme-border)",
              color: "var(--theme-ink)",
              fontFamily: "var(--font-label)",
            }}
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
          <button
            type="button"
            onClick={onExit}
            disabled={busy}
            className="min-h-11 rounded-full border px-4 text-xs font-medium disabled:opacity-50 sm:flex-none"
            style={{
              borderColor: "var(--theme-border)",
              color: "var(--theme-ink)",
              fontFamily: "var(--font-label)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy || selectedCount === 0}
            className="col-span-2 min-h-11 rounded-full px-4 text-xs font-medium text-white disabled:opacity-50 sm:col-auto sm:flex-none"
            style={{
              backgroundColor: "#dc2626",
              fontFamily: "var(--font-label)",
            }}
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
