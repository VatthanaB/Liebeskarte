"use client";

import { useMemo, useState } from "react";
import type { Memory, MilestoneType } from "@/lib/types";
import { MILESTONE_LABELS } from "@/lib/types";
import {
  personalMemoriesFor,
  sharedMemories,
} from "@/lib/memory-visibility";
import {
  flattenPhotos,
  filterPhotosByMonth,
  filterPhotosByType,
  filterPhotosByYear,
  getUniqueMonths,
  getUniqueYears,
  groupPhotosByMonth,
  mosaicAspect,
  cardTilt,
  formatShortDate,
  MONTH_SHORT_LABELS,
  type PhotoEntry,
} from "@/lib/photos";
import { PhotoLightbox, type LightboxPhoto } from "./PhotoLightbox";
import { useCurrentPartner } from "./CurrentPartnerProvider";

interface AlbumGridProps {
  memories: Memory[];
  photoUrlMap: Record<string, string[]>;
}

type AlbumScope = "shared" | "personal";

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
  const { partner } = useCurrentPartner();
  const [scope, setScope] = useState<AlbumScope>("shared");
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [monthFilter, setMonthFilter] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<MilestoneType | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const scopedMemories = useMemo(() => {
    if (scope === "personal") return personalMemoriesFor(memories, partner);
    return sharedMemories(memories);
  }, [memories, partner, scope]);

  const allPhotos = useMemo(
    () => flattenPhotos(scopedMemories, photoUrlMap),
    [scopedMemories, photoUrlMap],
  );

  const photoMemories = useMemo(
    () => allPhotos.map((entry) => entry.memory),
    [allPhotos],
  );
  const years = useMemo(() => getUniqueYears(photoMemories), [photoMemories]);
  const months = useMemo(
    () => getUniqueMonths(photoMemories, yearFilter),
    [photoMemories, yearFilter],
  );

  const filteredPhotos = useMemo(() => {
    let result = allPhotos;
    result = filterPhotosByYear(result, yearFilter);
    result = filterPhotosByMonth(result, monthFilter);
    result = filterPhotosByType(result, typeFilter);
    return result;
  }, [allPhotos, yearFilter, monthFilter, typeFilter]);

  const monthGroups = useMemo(
    () => groupPhotosByMonth(filteredPhotos),
    [filteredPhotos],
  );

  const displayPhotos = useMemo(
    () => monthGroups.flatMap((group) => group.photos),
    [monthGroups],
  );

  const lightboxPhotos: LightboxPhoto[] = displayPhotos.map((entry) => ({
    url: entry.url,
    memory: entry.memory,
  }));

  function selectScope(nextScope: AlbumScope) {
    setScope(nextScope);
    setYearFilter(null);
    setMonthFilter(null);
    setTypeFilter(null);
    setLightboxIndex(null);
  }

  function selectYear(year: number | null) {
    setYearFilter(year);
    setMonthFilter((current) => {
      if (current === null) return null;
      return getUniqueMonths(photoMemories, year).includes(current) ? current : null;
    });
  }

  function openLightbox(entry: PhotoEntry) {
    const index = displayPhotos.findIndex(
      (p) => p.url === entry.url && p.memoryId === entry.memoryId && p.photoIndex === entry.photoIndex,
    );
    if (index >= 0) setLightboxIndex(index);
  }

  if (allPhotos.length === 0) {
    return (
      <>
        <div className="mb-8 flex flex-wrap gap-2">
          {(["shared", "personal"] as AlbumScope[]).map((value) => {
            const active = scope === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => selectScope(value)}
                className="min-h-11 rounded-full px-4 py-2 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: active ? "var(--theme-accent)" : "transparent",
                  color: active ? "#fff" : "var(--theme-ink-muted)",
                  border: active ? "none" : "1px solid var(--theme-border)",
                  fontFamily: "var(--font-label)",
                }}
              >
                {value === "shared" ? "Shared" : "Personal"}
              </button>
            );
          })}
        </div>
        <div
          className="rounded-xl border p-8 text-center"
          style={{ borderColor: "var(--theme-border)" }}
        >
          <p className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {scope === "personal" ? "No personal photos yet" : "No photos yet"}
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
            {scope === "personal"
              ? "Photos from your personal memories will show up here."
              : "Add photos to your shared memories on the map to fill your album."}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2">
        {(["shared", "personal"] as AlbumScope[]).map((value) => {
          const active = scope === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => selectScope(value)}
              className="min-h-11 rounded-full px-4 py-2 text-xs font-medium transition-colors"
              style={{
                backgroundColor: active ? "var(--theme-accent)" : "transparent",
                color: active ? "#fff" : "var(--theme-ink-muted)",
                border: active ? "none" : "1px solid var(--theme-border)",
                fontFamily: "var(--font-label)",
              }}
            >
              {value === "shared" ? "Shared" : "Personal"}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectYear(null)}
            className="album-filter-chip min-h-11 rounded-full px-4 py-2 text-xs font-medium transition-colors"
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
              onClick={() => selectYear(year)}
              className="album-filter-chip min-h-11 rounded-full px-4 py-2 text-xs font-medium transition-colors"
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

        {months.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMonthFilter(null)}
              className="album-filter-chip min-h-11 rounded-full px-4 py-2 text-xs font-medium transition-colors"
              style={{
                backgroundColor: monthFilter === null ? "var(--theme-accent)" : "var(--theme-accent-light)",
                color: monthFilter === null ? "#fff" : "var(--theme-ink-muted)",
                fontFamily: "var(--font-label)",
              }}
            >
              All months
            </button>
            {months.map((month) => (
              <button
                key={month}
                type="button"
                onClick={() => setMonthFilter(month)}
                className="album-filter-chip min-h-11 rounded-full px-4 py-2 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: monthFilter === month ? "var(--theme-accent)" : "var(--theme-accent-light)",
                  color: monthFilter === month ? "#fff" : "var(--theme-ink-muted)",
                  fontFamily: "var(--font-label)",
                }}
              >
                {MONTH_SHORT_LABELS[month - 1]}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map(({ value, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setTypeFilter(value)}
              className="album-filter-chip min-h-11 rounded-full px-4 py-2 text-xs font-medium transition-colors"
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
        <div className="space-y-10">
          {monthGroups.map((group) => (
            <section key={`${group.year}-${group.month}`}>
              <h2
                className="mb-4 text-xl font-semibold md:text-2xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {group.label}
              </h2>
              <div className="album-mosaic grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
                {group.photos.map((entry, index) => {
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
                          loading="lazy"
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
            </section>
          ))}
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
