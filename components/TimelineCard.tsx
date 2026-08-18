"use client";

import { useState } from "react";
import type { Memory } from "@/lib/types";
import { MILESTONE_ICONS, MILESTONE_LABELS } from "@/lib/types";
import { cardTilt, formatShortDate } from "@/lib/photos";
import { useTheme } from "./ThemeProvider";
import { PhotoLightbox, type LightboxPhoto } from "./PhotoLightbox";

interface TimelineCardProps {
  memory: Memory;
  photoUrls?: string[];
  side: "left" | "right";
  onViewOnMap: (memory: Memory) => void;
}

export function TimelineCard({
  memory,
  photoUrls = [],
  side,
  onViewOnMap,
}: TimelineCardProps) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const color = theme.markerColors[memory.type];
  const tilt = cardTilt(memory.id);
  const hasPhotos = photoUrls.length > 0;

  const lightboxPhotos: LightboxPhoto[] = photoUrls.map((url) => ({
    url,
    memory,
  }));

  return (
    <>
      <article
        className={`timeline-card timeline-card--${side} timeline-reveal ${expanded ? "timeline-card--expanded" : ""}`}
        data-memory-id={memory.id}
      >
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="timeline-card__inner group w-full text-left"
          style={{ transform: expanded ? "rotate(0deg)" : `rotate(${tilt}deg)` }}
        >
          <div
            className="overflow-hidden rounded-xl border shadow-md transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg"
            style={{
              borderColor: "var(--theme-border)",
              backgroundColor: "var(--theme-surface)",
            }}
          >
            {hasPhotos ? (
              <div className="relative">
                <div className={`relative ${expanded ? "h-72 md:h-96" : "h-56 md:h-72"} overflow-hidden`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrls[0]}
                    alt={memory.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="photo-tape photo-tape--tl" />
                  <div className="photo-tape photo-tape--tr" />
                </div>
                {photoUrls.length > 1 && !expanded && (
                  <div className="flex gap-1.5 overflow-x-auto p-2">
                    {photoUrls.slice(1, 4).map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-md object-cover"
                      />
                    ))}
                    {photoUrls.length > 4 && (
                      <span
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md text-xs font-medium"
                        style={{
                          backgroundColor: "var(--theme-accent-light)",
                          color: "var(--theme-ink-muted)",
                        }}
                      >
                        +{photoUrls.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`flex flex-col items-center justify-center ${expanded ? "h-48" : "h-40"} px-6`}
                style={{
                  background: `linear-gradient(135deg, ${color}22 0%, var(--theme-accent-light) 100%)`,
                }}
              >
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
                  style={{ backgroundColor: color, color: "#fff" }}
                >
                  {MILESTONE_ICONS[memory.type]}
                </span>
                <p
                  className="mt-3 text-sm"
                  style={{ color: "var(--theme-ink-muted)" }}
                >
                  {memory.placeName}
                </p>
              </div>
            )}

            <div className="p-4 md:p-5">
              <span
                className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--theme-accent-light)",
                  color,
                  fontFamily: "var(--font-label)",
                }}
              >
                <span>{MILESTONE_ICONS[memory.type]}</span>
                {MILESTONE_LABELS[memory.type]}
              </span>

              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
              >
                {formatShortDate(memory.date)}
              </p>

              <h3
                className="mt-1 text-lg font-semibold leading-tight md:text-xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {memory.title}
              </h3>

              <p className="mt-1 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
                {memory.placeName}
              </p>
              {(expanded || !hasPhotos) &&
                memory.address &&
                memory.address !== memory.placeName && (
                  <p className="text-xs leading-snug" style={{ color: "var(--theme-ink-muted)" }}>
                    {memory.address}
                  </p>
                )}

              {memory.journal && (
                <p
                  className={`mt-2 text-sm leading-relaxed ${expanded ? "" : "line-clamp-2"}`}
                  style={{ color: "var(--theme-ink-muted)" }}
                >
                  {memory.journal}
                </p>
              )}

              {expanded && hasPhotos && photoUrls.length > 1 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {photoUrls.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(i);
                      }}
                      className="overflow-hidden rounded-lg"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="aspect-square w-full object-cover transition-transform hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              )}

              {expanded && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewOnMap(memory);
                    }}
                    className="rounded-full px-4 py-1.5 text-xs font-medium text-white"
                    style={{ backgroundColor: "var(--theme-accent)" }}
                  >
                    View on map
                  </button>
                  {hasPhotos && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(0);
                      }}
                      className="rounded-full border px-4 py-1.5 text-xs font-medium"
                      style={{
                        borderColor: "var(--theme-border)",
                        color: "var(--theme-ink-muted)",
                      }}
                    >
                      View photos
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </button>
      </article>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={lightboxPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
