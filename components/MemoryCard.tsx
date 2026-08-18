"use client";

import { useRef, type PointerEvent } from "react";
import type { Memory, MilestoneType } from "@/lib/types";
import { MILESTONE_ICONS, MILESTONE_LABELS } from "@/lib/types";
import { useCurrentPartner } from "./CurrentPartnerProvider";
import { JournalEntries } from "./JournalEntries";
import { useTheme } from "./ThemeProvider";

interface MemoryStackNav {
  index: number;
  total: number;
  items: Memory[];
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
}

interface MemoryCardProps {
  memory: Memory;
  photoUrls?: string[];
  onClose?: () => void;
  onEdit?: () => void;
  compact?: boolean;
  stack?: MemoryStackNav;
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
  stack,
}: MemoryCardProps) {
  const { theme } = useTheme();
  const { partner } = useCurrentPartner();
  const markerColor = theme.markerColors[memory.type];
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (!stack) return;
    if ((event.target as HTMLElement).closest("button, a, input, textarea")) {
      return;
    }
    swipeRef.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    if (!stack || !swipeRef.current) return;
    const dx = event.clientX - swipeRef.current.x;
    const dy = event.clientY - swipeRef.current.y;
    swipeRef.current = null;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) stack.onNext();
    else stack.onPrev();
  }

  return (
    <article
      className={`overflow-hidden rounded-xl ${theme.cardClass}`}
      style={{
        backgroundColor: "var(--theme-surface)",
        fontFamily: "var(--font-body)",
        touchAction: stack ? "pan-y" : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        swipeRef.current = null;
      }}
    >
      {stack && (
        <div
          className="flex items-center gap-2 border-b px-3 py-1"
          style={{ borderColor: "var(--theme-border)" }}
        >
          <p
            className="min-w-0 flex-1 truncate text-[10px] uppercase tracking-wider"
            style={{
              color: "var(--theme-ink-muted)",
              fontFamily: "var(--font-label)",
            }}
          >
            {stack.total} memories here
          </p>
          <button
            type="button"
            onClick={stack.onPrev}
            disabled={stack.index === 0}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:opacity-30"
            style={{ color: "var(--theme-ink)" }}
            aria-label="Previous memory"
          >
            ‹
          </button>
          <p
            className="shrink-0 text-xs tabular-nums"
            style={{
              color: "var(--theme-ink-muted)",
              fontFamily: "var(--font-label)",
            }}
            aria-live="polite"
          >
            {stack.index + 1}/{stack.total}
          </p>
          <button
            type="button"
            onClick={stack.onNext}
            disabled={stack.index === stack.total - 1}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:opacity-30"
            style={{ color: "var(--theme-ink)" }}
            aria-label="Next memory"
          >
            ›
          </button>
        </div>
      )}

      {photoUrls[0] && (
        <div className={`relative ${compact ? "h-32" : "h-48"} w-full overflow-hidden`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrls[0]}
            alt={memory.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute -top-2 left-6 h-8 w-16 rotate-[-2deg] bg-white/40 shadow-sm" />
        </div>
      )}

      <div key={memory.id} className="memory-card__pane">
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
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg leading-none opacity-60 hover:opacity-100"
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

          <JournalEntries
            memory={memory}
            currentPartner={partner}
            compact={compact}
          />

          {photoUrls.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {photoUrls.slice(1).map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt={`${memory.title}, photo ${i + 2}`}
                  loading="lazy"
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ))}
            </div>
          )}

          {stack && (
            <div className="mt-4 flex flex-wrap items-center justify-center">
              {stack.items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => stack.onGoTo(i)}
                  className="flex h-11 w-11 items-center justify-center"
                  aria-label={`Show memory ${i + 1} of ${stack.total}: ${item.title}`}
                  aria-current={i === stack.index ? "true" : undefined}
                >
                  <span
                    className="block h-2.5 w-2.5 rounded-full transition-transform"
                    style={{
                      backgroundColor: theme.markerColors[item.type as MilestoneType],
                      opacity: i === stack.index ? 1 : 0.35,
                      transform: i === stack.index ? "scale(1.25)" : "scale(1)",
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {stack && (
            <p
              className="mt-1 text-center text-[11px] md:hidden"
              style={{
                color: "var(--theme-ink-muted)",
                fontFamily: "var(--font-label)",
              }}
            >
              Swipe for the next memory
            </p>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-xs uppercase tracking-wider transition-opacity hover:opacity-70 active:opacity-50"
              style={{
                color: "var(--theme-ink-muted)",
                fontFamily: "var(--font-label)",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
