"use client";

import { visibleJournals } from "@/lib/journals";
import type { Memory, PartnerId } from "@/lib/types";
import { PARTNERS } from "@/lib/types";

interface JournalEntriesProps {
  memory: Memory;
  currentPartner: PartnerId;
  compact?: boolean;
  lineClamp?: boolean;
  className?: string;
}

export function JournalEntries({
  memory,
  currentPartner,
  compact = false,
  lineClamp = false,
  className = "",
}: JournalEntriesProps) {
  const entries = visibleJournals(memory, currentPartner);

  if (entries.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {entries.map(({ partnerId, entry }) => (
        <div key={partnerId}>
          <p
            className="mb-1 text-[10px] font-medium uppercase tracking-wider"
            style={{
              color: "var(--theme-ink-muted)",
              fontFamily: "var(--font-label)",
            }}
          >
            {PARTNERS[partnerId].label}
          </p>
          <p
            className={`${compact ? "text-sm" : "text-base"} leading-relaxed ${lineClamp ? "line-clamp-2" : ""}`}
            style={{ color: "var(--theme-ink-muted)" }}
          >
            {entry.text}
          </p>
        </div>
      ))}
    </div>
  );
}
