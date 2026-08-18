"use client";

import type { Memory } from "@/lib/types";
import { MILESTONE_ICONS, MILESTONE_LABELS } from "@/lib/types";
import { useTheme } from "./ThemeProvider";

interface MemoryCardProps {
  memory: Memory;
  photoUrls?: string[];
  onClose?: () => void;
  onEdit?: () => void;
  compact?: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function MemoryCard({
  memory,
  photoUrls = [],
  onClose,
  onEdit,
  compact = false,
}: MemoryCardProps) {
  const { theme } = useTheme();
  const markerColor = theme.markerColors[memory.type];

  return (
    <article
      className={`overflow-hidden rounded-xl ${theme.cardClass}`}
      style={{
        backgroundColor: "var(--theme-surface)",
        fontFamily: "var(--font-body)",
      }}
    >
          {photoUrls[0] && (
        <div className={`relative ${compact ? "h-32" : "h-48"} w-full overflow-hidden`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrls[0]}
            alt={memory.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute -top-2 left-6 h-8 w-16 rotate-[-2deg] bg-white/40 shadow-sm" />
        </div>
      )}

      <div className={`${compact ? "p-4" : "p-5"}`}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <span
              className="mb-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
              style={{
                backgroundColor: "var(--theme-accent-light)",
                color: markerColor,
                fontFamily: "var(--font-label)",
              }}
            >
              <span>{MILESTONE_ICONS[memory.type]}</span>
              {MILESTONE_LABELS[memory.type]}
            </span>
            <h3
              className={`${compact ? "text-lg" : "text-xl"} font-semibold leading-tight`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {memory.title}
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-full p-1 text-lg leading-none opacity-60 hover:opacity-100"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>

        <p
          className="mb-2 text-xs uppercase tracking-wider"
          style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
        >
          {formatDate(memory.date)} · {memory.placeName}
        </p>
        {memory.address && memory.address !== memory.placeName && (
          <p
            className="mb-3 text-sm leading-snug"
            style={{ color: "var(--theme-ink-muted)" }}
          >
            {memory.address}
          </p>
        )}

        {memory.journal && (
          <p
            className={`${compact ? "text-sm" : "text-base"} leading-relaxed`}
            style={{ color: "var(--theme-ink-muted)" }}
          >
            {memory.journal}
          </p>
        )}

        {photoUrls.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {photoUrls.slice(1).map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
            ))}
          </div>
        )}

        {onEdit && (
          <button
            onClick={onEdit}
            className="mt-4 w-full rounded-lg py-2 text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--theme-accent-light)",
              color: "var(--theme-accent)",
            }}
          >
            Edit memory
          </button>
        )}
      </div>
    </article>
  );
}
