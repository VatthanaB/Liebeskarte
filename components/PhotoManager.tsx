"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Memory, Photo } from "@/lib/types";
import {
  canManageMemory,
  personalMemoriesFor,
  sharedMemories,
} from "@/lib/memory-visibility";
import {
  deletePhoto,
  getAllPhotos,
  updatePhotoHidden,
} from "@/lib/db";
import { LoveLoading } from "@/components/LoveLoading";
import { DataErrorBanner } from "@/components/DataErrorBanner";
import {
  formatShortDate,
  getMemoryMonth,
  getMemoryYear,
  getUniqueMonths,
  getUniqueYears,
  MONTH_LABELS,
} from "@/lib/photos";
import { PhotoLightbox, type LightboxPhoto } from "./PhotoLightbox";
import { useCurrentPartner } from "./CurrentPartnerProvider";
import { useConfirm } from "./ConfirmDialog";

type VisibilityFilter = "all" | "visible" | "hidden";
type PhotoScope = "shared" | "personal";
type PhotoSort =
  | "event-date-desc"
  | "event-date-asc"
  | "event-title"
  | "upload-desc"
  | "upload-asc";

interface PhotoManagerProps {
  memories: Memory[];
}

interface ManagedPhoto extends Photo {
  memory: Memory | undefined;
}

function sortManagedPhotos(photos: ManagedPhoto[], sort: PhotoSort): ManagedPhoto[] {
  const sorted = [...photos];

  sorted.sort((a, b) => {
    switch (sort) {
      case "event-date-desc":
        return (b.memory?.date ?? "").localeCompare(a.memory?.date ?? "");
      case "event-date-asc":
        return (a.memory?.date ?? "").localeCompare(b.memory?.date ?? "");
      case "event-title":
        return (a.memory?.title ?? "").localeCompare(b.memory?.title ?? "", undefined, {
          sensitivity: "base",
        });
      case "upload-desc":
        return b.createdAt.localeCompare(a.createdAt);
      case "upload-asc":
        return a.createdAt.localeCompare(b.createdAt);
      default:
        return 0;
    }
  });

  return sorted;
}

export function PhotoManager({ memories }: PhotoManagerProps) {
  const { partner } = useCurrentPartner();
  const confirm = useConfirm();
  const [photos, setPhotos] = useState<ManagedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<PhotoScope>("shared");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [memoryFilter, setMemoryFilter] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [monthFilter, setMonthFilter] = useState<number | null>(null);
  const [sort, setSort] = useState<PhotoSort>("event-date-desc");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const memoryById = useMemo(
    () => new Map(memories.map((memory) => [memory.id, memory])),
    [memories],
  );

  const scopedMemories = useMemo(() => {
    if (scope === "personal") return personalMemoriesFor(memories, partner);
    return sharedMemories(memories);
  }, [memories, partner, scope]);

  const manageablePhotos = useMemo(
    () =>
      photos.filter((photo) => {
        const memory = photo.memory;
        if (!memory) return false;
        return canManageMemory(memory, partner);
      }),
    [photos, partner],
  );

  const scopedPhotos = useMemo(
    () =>
      manageablePhotos.filter((photo) => {
        const memory = photo.memory;
        if (!memory) return false;
        if (scope === "personal") {
          return memory.visibility === "personal" && memory.owner === partner;
        }
        return memory.visibility === "shared";
      }),
    [manageablePhotos, partner, scope],
  );

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await getAllPhotos();
      setPhotos(
        rows.map((photo) => ({
          ...photo,
          memory: memoryById.get(photo.memoryId),
        })),
      );
    } catch (error) {
      console.error("[atlas:photos] load failed", error);
      setLoadError("Couldn't load photos. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [memoryById]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const eventOptions = useMemo(() => {
    const memoryIds = new Set(scopedPhotos.map((photo) => photo.memoryId));
    return scopedMemories
      .filter((memory) => memoryIds.has(memory.id))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [scopedMemories, scopedPhotos]);

  const years = useMemo(
    () => getUniqueYears(eventOptions),
    [eventOptions],
  );

  const months = useMemo(
    () => getUniqueMonths(eventOptions, yearFilter),
    [eventOptions, yearFilter],
  );

  function selectYear(year: number | null) {
    setYearFilter(year);
    setMonthFilter((current) => {
      if (current === null) return null;
      return getUniqueMonths(eventOptions, year).includes(current) ? current : null;
    });
  }

  function selectScope(nextScope: PhotoScope) {
    setScope(nextScope);
    setMemoryFilter(null);
    setYearFilter(null);
    setMonthFilter(null);
    setLightboxIndex(null);
  }

  const filteredPhotos = useMemo(() => {
    let result = scopedPhotos;

    if (visibilityFilter === "visible") {
      result = result.filter((photo) => !photo.hidden);
    } else if (visibilityFilter === "hidden") {
      result = result.filter((photo) => photo.hidden);
    }

    if (memoryFilter) {
      result = result.filter((photo) => photo.memoryId === memoryFilter);
    }

    if (yearFilter !== null) {
      result = result.filter(
        (photo) => photo.memory && getMemoryYear(photo.memory) === yearFilter,
      );
    }

    if (monthFilter !== null) {
      result = result.filter(
        (photo) => photo.memory && getMemoryMonth(photo.memory) === monthFilter,
      );
    }

    return sortManagedPhotos(result, sort);
  }, [scopedPhotos, visibilityFilter, memoryFilter, yearFilter, monthFilter, sort]);

  const monthGroups = useMemo(() => {
    const groups = new Map<string, { key: string; label: string; photos: ManagedPhoto[] }>();

    for (const photo of filteredPhotos) {
      const key = photo.memory
        ? `${getMemoryYear(photo.memory)}-${String(getMemoryMonth(photo.memory)).padStart(2, "0")}`
        : "unknown";
      const existing = groups.get(key);
      if (existing) {
        existing.photos.push(photo);
        continue;
      }

      const label = photo.memory
        ? `${MONTH_LABELS[getMemoryMonth(photo.memory) - 1]} ${getMemoryYear(photo.memory)}`
        : "Unknown date";
      groups.set(key, { key, label, photos: [photo] });
    }

    return Array.from(groups.values()).sort((a, b) => {
      if (a.key === "unknown") return 1;
      if (b.key === "unknown") return -1;
      return b.key.localeCompare(a.key);
    });
  }, [filteredPhotos]);

  const lightboxPhotos: LightboxPhoto[] = useMemo(
    () =>
      monthGroups
        .flatMap((group) => group.photos)
        .filter((photo) => photo.memory)
        .map((photo) => ({
          url: photo.url,
          memory: photo.memory!,
        })),
    [monthGroups],
  );

  async function handleToggleHidden(photo: ManagedPhoto) {
    setBusyId(photo.id);
    setActionError(null);
    try {
      const nextHidden = !photo.hidden;
      await updatePhotoHidden(photo.id, nextHidden);
      setPhotos((prev) =>
        prev.map((item) =>
          item.id === photo.id ? { ...item, hidden: nextHidden } : item,
        ),
      );
    } catch (error) {
      console.error("[atlas:photos] toggle hidden failed", error);
      setActionError("Couldn't update photo visibility. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(photo: ManagedPhoto) {
    const memoryTitle = photo.memory?.title ?? "this memory";
    const confirmed = await confirm({
      title: "Delete this photo?",
      description: `Remove it from “${memoryTitle}”. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;

    setBusyId(photo.id);
    setActionError(null);
    try {
      await deletePhoto(photo.id);
      setPhotos((prev) => prev.filter((item) => item.id !== photo.id));
      setLightboxIndex(null);
    } catch (error) {
      console.error("[atlas:photos] delete failed", error);
      setActionError("Couldn't delete photo. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  function openLightbox(photo: ManagedPhoto) {
    if (!photo.memory || !photo.url) return;
    const index = lightboxPhotos.findIndex(
      (entry) =>
        entry.url === photo.url && entry.memory.id === photo.memoryId,
    );
    if (index >= 0) setLightboxIndex(index);
  }

  const visibilityOptions: Array<{ value: VisibilityFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "visible", label: "Visible" },
    { value: "hidden", label: "Hidden" },
  ];

  const selectClass =
    "min-h-11 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2";
  const selectStyle = {
    borderColor: "var(--theme-border)",
    backgroundColor: "var(--theme-bg)",
    color: "var(--theme-ink)",
    fontFamily: "var(--font-body)",
  };
  const labelClass =
    "mb-1 block text-[10px] uppercase tracking-wider";
  const labelStyle = { color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" };

  if (loading) {
    return <LoveLoading />;
  }

  if (loadError) {
    return <DataErrorBanner message={loadError} onRetry={loadPhotos} />;
  }

  if (manageablePhotos.length === 0) {
    return (
      <div
        className="rounded-xl border p-8 text-center"
        style={{ borderColor: "var(--theme-border)" }}
      >
        <p className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          No photos yet
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
          Add photos to memories on the map. Hidden photos will appear here for management.
        </p>
      </div>
    );
  }

  return (
    <>
      {actionError && (
        <div className="mb-4">
          <DataErrorBanner
            message={actionError}
            onDismiss={() => setActionError(null)}
          />
        </div>
      )}
      <div className="mb-6 flex flex-wrap gap-2">
        {(["shared", "personal"] as PhotoScope[]).map((value) => {
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

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <label className="col-span-2 block md:col-span-1">
          <span className={labelClass} style={labelStyle}>
            Event
          </span>
          <select
            className={selectClass}
            style={selectStyle}
            value={memoryFilter ?? ""}
            onChange={(e) => setMemoryFilter(e.target.value || null)}
          >
            <option value="">All events</option>
            {eventOptions.map((memory) => (
              <option key={memory.id} value={memory.id}>
                {memory.title} · {formatShortDate(memory.date)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass} style={labelStyle}>
            Sort
          </span>
          <select
            className={selectClass}
            style={selectStyle}
            value={sort}
            onChange={(e) => setSort(e.target.value as PhotoSort)}
          >
            <option value="event-date-desc">Newest first</option>
            <option value="event-date-asc">Oldest first</option>
            <option value="event-title">Title A–Z</option>
            <option value="upload-desc">Upload · newest</option>
            <option value="upload-asc">Upload · oldest</option>
          </select>
        </label>

        <label className="block">
          <span className={labelClass} style={labelStyle}>
            Visibility
          </span>
          <select
            className={selectClass}
            style={selectStyle}
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as VisibilityFilter)}
          >
            {visibilityOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass} style={labelStyle}>
            Year
          </span>
          <select
            className={selectClass}
            style={selectStyle}
            value={yearFilter ?? ""}
            onChange={(e) =>
              selectYear(e.target.value ? Number.parseInt(e.target.value, 10) : null)
            }
          >
            <option value="">All years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass} style={labelStyle}>
            Month
          </span>
          <select
            className={selectClass}
            style={selectStyle}
            value={monthFilter ?? ""}
            disabled={months.length === 0}
            onChange={(e) =>
              setMonthFilter(e.target.value ? Number.parseInt(e.target.value, 10) : null)
            }
          >
            <option value="">All months</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {MONTH_LABELS[month - 1]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mb-6 text-xs" style={{ color: "var(--theme-ink-muted)" }}>
        {filteredPhotos.length} of {scopedPhotos.length} {scope} photos
      </p>

      {filteredPhotos.length === 0 ? (
        <p className="text-center text-sm" style={{ color: "var(--theme-ink-muted)" }}>
          {scope === "personal"
            ? "Photos from your personal memories will show up here."
            : "No photos match these filters."}
        </p>
      ) : (
        <div className="space-y-10">
          {monthGroups.map((group) => (
            <section key={group.key}>
              <h3
                className="mb-4 text-lg font-semibold md:text-xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {group.label}
              </h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
                {group.photos.map((photo) => {
                  const memory = photo.memory;
                  const isBusy = busyId === photo.id;

                  return (
                    <div
                      key={photo.id}
                      className="overflow-hidden rounded-xl border shadow-sm"
                      style={{ borderColor: "var(--theme-border)" }}
                    >
                      <button
                        type="button"
                        onClick={() => openLightbox(photo)}
                        disabled={!photo.url || !memory}
                        className="relative block w-full overflow-hidden disabled:opacity-50"
                      >
                        <div className="relative aspect-square w-full">
                          {photo.url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={photo.url}
                              alt={memory?.title ?? photo.name}
                              loading="lazy"
                              className={`h-full w-full object-cover ${photo.hidden ? "opacity-60" : ""}`}
                            />
                          ) : (
                            <div
                              className="flex h-full w-full items-center justify-center text-xs"
                              style={{ color: "var(--theme-ink-muted)" }}
                            >
                              No preview
                            </div>
                          )}
                          {photo.hidden && (
                            <span
                              className="absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white"
                              style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
                            >
                              Hidden
                            </span>
                          )}
                        </div>
                      </button>

                      <div className="space-y-2 p-3">
                        {memory ? (
                          <>
                            <p
                              className="truncate text-sm font-medium"
                              style={{ fontFamily: "var(--font-display)" }}
                            >
                              {memory.title}
                            </p>
                            <p
                              className="truncate text-xs"
                              style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
                            >
                              {formatShortDate(memory.date)} · {memory.placeName}
                            </p>
                            <Link
                              href={`/?memory=${memory.id}`}
                              className="inline-block text-xs font-medium underline underline-offset-2"
                              style={{ color: "var(--theme-accent)" }}
                            >
                              View memory on map
                            </Link>
                          </>
                        ) : (
                          <p className="text-xs" style={{ color: "var(--theme-ink-muted)" }}>
                            Memory not found
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleToggleHidden(photo)}
                            disabled={isBusy}
                            className="min-h-11 flex-1 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50"
                            style={{
                              borderColor: "var(--theme-border)",
                              color: "var(--theme-ink-muted)",
                            }}
                          >
                            {photo.hidden ? "Show" : "Hide"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(photo)}
                            disabled={isBusy}
                            className="min-h-11 flex-1 rounded-lg px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                            style={{ backgroundColor: "#dc2626" }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {lightboxIndex !== null && lightboxPhotos.length > 0 && (
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
