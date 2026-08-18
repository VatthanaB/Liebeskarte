"use client";

import { useMemo, useState } from "react";
import type { Memory, MilestoneType } from "@/lib/types";
import { MILESTONE_LABELS } from "@/lib/types";
import {
  flattenPhotos,
  filterPhotosByType,
  filterPhotosByYear,
  getUniqueYears,
  mosaicAspect,
  cardTilt,
  formatShortDate,
  type PhotoEntry,
} from "@/lib/photos";
import { PhotoLightbox, type LightboxPhoto } from "./PhotoLightbox";

interface AlbumGridProps {
  memories: Memory[];
  photoUrlMap: Record<string, string[]>;
}

const TYPE_FILTERS: Array<{ value: MilestoneType | null; label: string }> = [
  { value: null, label: "All" },
  { value: "met", label: MILESTONE_LABELS.met },
  { value: "date", label: MILESTONE_LABELS.date },
  { value: "trip", label: MILESTONE_LABELS.trip },
  { value: "home", label: MILESTONE_LABELS.home },
  { value: "celebration", label: MILESTONE_LABELS.celebration },
  { value: "custom", label: MILESTONE_LABELS.custom },
];

export function AlbumGrid({ memories, photoUrlMap }: AlbumGridProps) {
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<MilestoneType | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const allPhotos = useMemo(
    () => flattenPhotos(memories, photoUrlMap),
    [memories, photoUrlMap],
  );

  const years = useMemo(() => getUniqueYears(memories), [memories]);

  const filteredPhotos = useMemo(() => {
    let result = allPhotos;
    result = filterPhotosByYear(result, yearFilter);
    result = filterPhotosByType(result, typeFilter);
    return result;
  }, [allPhotos, yearFilter, typeFilter]);

  const lightboxPhotos: LightboxPhoto[] = filteredPhotos.map((entry) => ({
    url: entry.url,
    memory: entry.memory,
  }));

  function openLightbox(entry: PhotoEntry) {
    const index = filteredPhotos.findIndex(
      (p) => p.url === entry.url && p.memoryId === entry.memoryId && p.photoIndex === entry.photoIndex,
    );
    if (index >= 0) setLightboxIndex(index);
  }

  if (allPhotos.length === 0) {
    return (
      <div
        className="rounded-xl border p-8 text-center"
        style={{ borderColor: "var(--theme-border)" }}
      >
        <p className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          No photos yet
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
          Add photos to your memories on the map to fill your album.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setYearFilter(null)}
            className="album-filter-chip rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={{
              backgroundColor: yearFilter === null ? "var(--theme-accent)" : "var(--theme-accent-light)",
              color: yearFilter === null ? "#fff" : "var(--theme-ink-muted)",
              fontFamily: "var(--font-label)",
            }}
          >
            All years
          </button>
          {years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => setYearFilter(year)}
              className="album-filter-chip rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: yearFilter === year ? "var(--theme-accent)" : "var(--theme-accent-light)",
                color: yearFilter === year ? "#fff" : "var(--theme-ink-muted)",
                fontFamily: "var(--font-label)",
              }}
            >
              {year}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map(({ value, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setTypeFilter(value)}
              className="album-filter-chip rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: typeFilter === value ? "var(--theme-accent)" : "transparent",
                color: typeFilter === value ? "#fff" : "var(--theme-ink-muted)",
                border: typeFilter === value ? "none" : "1px solid var(--theme-border)",
                fontFamily: "var(--font-label)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredPhotos.length === 0 ? (
        <p className="text-center text-sm" style={{ color: "var(--theme-ink-muted)" }}>
          No photos match these filters.
        </p>
      ) : (
        <div className="album-mosaic grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {filteredPhotos.map((entry, index) => {
            const tilt = cardTilt(`${entry.memoryId}-${entry.photoIndex}`);
            return (
              <button
                key={`${entry.memoryId}-${entry.photoIndex}`}
                type="button"
                onClick={() => openLightbox(entry)}
                className="album-tile group relative overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                style={{
                  borderColor: "var(--theme-border)",
                  transform: `rotate(${tilt}deg)`,
                }}
              >
                <div className={`relative ${mosaicAspect(index)} w-full overflow-hidden`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.url}
                    alt={entry.memory.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="photo-tape photo-tape--tl" />
                  <div
                    className="album-tile__caption absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <p className="truncate text-xs font-medium text-white">
                      {entry.memory.title}
                    </p>
                    <p className="truncate text-[10px] text-white/80">
                      {formatShortDate(entry.memory.date)} · {entry.memory.placeName}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

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
