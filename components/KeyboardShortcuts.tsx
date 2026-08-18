const SHORTCUTS = [
  { keys: "Esc", action: "Close a memory card, editor, lightbox, or menu" },
  { keys: "N", action: "Add a new memory on the map" },
  { keys: "← →", action: "Step through stacked memories or lightbox photos" },
];

export function KeyboardShortcuts() {
  return (
    <section
      className="mb-10 rounded-xl border p-4 md:p-5"
      style={{
        borderColor: "var(--theme-border)",
        backgroundColor: "var(--theme-surface)",
      }}
    >
      <h2
        className="text-lg font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Keyboard
      </h2>
      <p className="mt-1 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
        Shortcuts stay off while you are typing in a field.
      </p>
      <ul className="mt-4 space-y-3">
        {SHORTCUTS.map((shortcut) => (
          <li
            key={shortcut.keys}
            className="flex flex-wrap items-center gap-3 text-sm"
          >
            <kbd
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-xs font-medium"
              style={{
                borderColor: "var(--theme-border)",
                color: "var(--theme-ink)",
                fontFamily: "var(--font-label)",
              }}
            >
              {shortcut.keys}
            </kbd>
            <span style={{ color: "var(--theme-ink-muted)" }}>{shortcut.action}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
