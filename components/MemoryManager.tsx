"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Memory, MilestoneType } from "@/lib/types";
import { MILESTONE_ICONS, MILESTONE_LABELS } from "@/lib/types";
import {
  canManageMemory,
  personalMemoriesFor,
  sharedMemories,
} from "@/lib/memory-visibility";
import { deleteMemory } from "@/lib/db";
import { DataErrorBanner } from "@/components/DataErrorBanner";
import {
  formatShortDate,
  getMemoryMonth,
  getMemoryYear,
  getUniqueMonths,
  getUniqueYears,
  MONTH_LABELS,
} from "@/lib/photos";
import { useCurrentPartner } from "./CurrentPartnerProvider";
import { useConfirm } from "./ConfirmDialog";
import { AddMemoryForm } from "./AddMemoryForm";

type MemoryScope = "shared" | "personal";
type MemorySort = "event-date-desc" | "event-date-asc" | "event-title";

const MILESTONE_TYPES = Object.keys(MILESTONE_LABELS) as MilestoneType[];

interface MemoryManagerProps {
  memories: Memory[];
  photoUrlMap: Record<string, string[]>;
  onReload: () => void;
}

function sortMemories(memories: Memory[], sort: MemorySort): Memory[] {
  const sorted = [...memories];

  sorted.sort((a, b) => {
    switch (sort) {
      case "event-date-desc":
        return b.date.localeCompare(a.date);
      case "event-date-asc":
        return a.date.localeCompare(b.date);
      case "event-title":
        return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      default:
        return 0;
    }
  });

  return sorted;
}

export function MemoryManager({ memories, photoUrlMap, onReload }: MemoryManagerProps) {
  const { partner } = useCurrentPartner();
  const confirm = useConfirm();
  const [scope, setScope] = useState<MemoryScope>("shared");
  const [typeFilter, setTypeFilter] = useState<MilestoneType | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [monthFilter, setMonthFilter] = useState<number | null>(null);
  const [sort, setSort] = useState<MemorySort>("event-date-desc");
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const manageableMemories = useMemo(
    () => memories.filter((memory) => canManageMemory(memory, partner)),
    [memories, partner],
  );

  const scopedMemories = useMemo(() => {
    if (scope === "personal") return personalMemoriesFor(manageableMemories, partner);
    return sharedMemories(manageableMemories);
  }, [manageableMemories, partner, scope]);

  const years = useMemo(() => getUniqueYears(scopedMemories), [scopedMemories]);

  const months = useMemo(
    () => getUniqueMonths(scopedMemories, yearFilter),
    [scopedMemories, yearFilter],
  );

  function selectYear(year: number | null) {
    setYearFilter(year);
    setMonthFilter((current) => {
      if (current === null) return null;
      return getUniqueMonths(scopedMemories, year).includes(current) ? current : null;
    });
  }

  function selectScope(nextScope: MemoryScope) {
    setScope(nextScope);
    setTypeFilter(null);
    setYearFilter(null);
    setMonthFilter(null);
    setEditingMemory(null);
  }

  const filteredMemories = useMemo(() => {
    let result = scopedMemories;

    if (typeFilter) {
      result = result.filter((memory) => memory.type === typeFilter);
    }

    if (yearFilter !== null) {
      result = result.filter((memory) => getMemoryYear(memory) === yearFilter);
    }

    if (monthFilter !== null) {
      result = result.filter((memory) => getMemoryMonth(memory) === monthFilter);
    }

    return sortMemories(result, sort);
  }, [scopedMemories, typeFilter, yearFilter, monthFilter, sort]);

  const monthGroups = useMemo(() => {
    const groups = new Map<string, { key: string; label: string; memories: Memory[] }>();

    for (const memory of filteredMemories) {
      const key = `${getMemoryYear(memory)}-${String(getMemoryMonth(memory)).padStart(2, "0")}`;
      const existing = groups.get(key);
      if (existing) {
        existing.memories.push(memory);
        continue;
      }

      groups.set(key, {
        key,
        label: `${MONTH_LABELS[getMemoryMonth(memory) - 1]} ${getMemoryYear(memory)}`,
        memories: [memory],
      });
    }

    return Array.from(groups.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [filteredMemories]);

  useEffect(() => {
    if (!editingMemory) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editingMemory]);

  async function handleDelete(memory: Memory) {
    const confirmed = await confirm({
      title: "Delete this memory?",
      description: `Remove “${memory.title}” and all its photos. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;

    setBusyId(memory.id);
    setActionError(null);
    try {
      await deleteMemory(memory.id);
      if (editingMemory?.id === memory.id) {
        setEditingMemory(null);
      }
      onReload();
    } catch (error) {
      console.error("[atlas:memories] delete failed", error);
      setActionError("Couldn't delete memory. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  function handleSave(_memory: Memory) {
    setEditingMemory(null);
    onReload();
  }

  async function handleDeleteFromEditor() {
    if (!editingMemory) return;
    await handleDelete(editingMemory);
  }

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

  if (manageableMemories.length === 0) {
    return (
      <div
        className="rounded-xl border p-8 text-center"
        style={{ borderColor: "var(--theme-border)" }}
      >
        <p className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          No memories yet
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
          Add a memory on the map to start your journal.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full px-6 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--theme-accent)" }}
        >
          Add a memory
        </Link>
      </div>
    );
  }

  return (
    <>
      {actionError && (
        <div className="mb-4">
          <DataErrorBanner message={actionError} onDismiss={() => setActionError(null)} />
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {(["shared", "personal"] as MemoryScope[]).map((value) => {
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

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <label className="block">
          <span className={labelClass} style={labelStyle}>
            Sort
          </span>
          <select
            className={selectClass}
            style={selectStyle}
            value={sort}
            onChange={(e) => setSort(e.target.value as MemorySort)}
          >
            <option value="event-date-desc">Newest first</option>
            <option value="event-date-asc">Oldest first</option>
            <option value="event-title">Title A–Z</option>
          </select>
        </label>

        <label className="block">
          <span className={labelClass} style={labelStyle}>
            Type
          </span>
          <select
            className={selectClass}
            style={selectStyle}
            value={typeFilter ?? ""}
            onChange={(e) => setTypeFilter((e.target.value || null) as MilestoneType | null)}
          >
            <option value="">All types</option>
            {MILESTONE_TYPES.map((type) => (
              <option key={type} value={type}>
                {MILESTONE_LABELS[type]}
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
        {filteredMemories.length} of {scopedMemories.length} {scope} memories
      </p>

      {filteredMemories.length === 0 ? (
        <p className="text-center text-sm" style={{ color: "var(--theme-ink-muted)" }}>
          {scope === "personal"
            ? "Your personal memories will show up here."
            : "No memories match these filters."}
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
                {group.memories.map((memory) => {
                  const coverUrl = photoUrlMap[memory.id]?.[0];
                  const isBusy = busyId === memory.id;
                  const photoCount = photoUrlMap[memory.id]?.length ?? 0;

                  return (
                    <div
                      key={memory.id}
                      className="overflow-hidden rounded-xl border shadow-sm"
                      style={{ borderColor: "var(--theme-border)" }}
                    >
                      <Link
                        href={`/?memory=${memory.id}`}
                        className="relative block w-full overflow-hidden"
                      >
                        <div className="relative aspect-square w-full">
                          {coverUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={coverUrl}
                              alt={memory.title}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div
                              className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center"
                              style={{ backgroundColor: "var(--theme-accent-light)" }}
                            >
                              <span className="text-2xl" aria-hidden="true">
                                {MILESTONE_ICONS[memory.type]}
                              </span>
                              <span
                                className="text-xs font-medium"
                                style={{ color: "var(--theme-ink-muted)" }}
                              >
                                {MILESTONE_LABELS[memory.type]}
                              </span>
                            </div>
                          )}
                          {photoCount > 1 && (
                            <span
                              className="absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-medium text-white"
                              style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
                            >
                              {photoCount} photos
                            </span>
                          )}
                        </div>
                      </Link>

                      <div className="space-y-2 p-3">
                        <p
                          className="truncate text-sm font-medium"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {memory.title}
                        </p>
                        <p
                          className="truncate text-xs"
                          style={{
                            color: "var(--theme-ink-muted)",
                            fontFamily: "var(--font-label)",
                          }}
                        >
                          {formatShortDate(memory.date)} · {memory.placeName}
                        </p>
                        <p
                          className="truncate text-xs"
                          style={{
                            color: "var(--theme-ink-muted)",
                            fontFamily: "var(--font-label)",
                          }}
                        >
                          {MILESTONE_LABELS[memory.type]}
                        </p>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <Link
                            href={`/?memory=${memory.id}`}
                            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border px-3 py-2 text-center text-xs font-medium"
                            style={{
                              borderColor: "var(--theme-border)",
                              color: "var(--theme-ink-muted)",
                            }}
                          >
                            View on map
                          </Link>
                          <button
                            type="button"
                            onClick={() => setEditingMemory(memory)}
                            disabled={isBusy}
                            className="min-h-11 flex-1 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50"
                            style={{
                              borderColor: "var(--theme-border)",
                              color: "var(--theme-ink-muted)",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(memory)}
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

      {editingMemory && (
        <div className="fixed inset-0 z-[1100]">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close editor"
            onClick={() => setEditingMemory(null)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:bottom-auto md:left-auto md:top-20 md:right-6 md:max-h-[calc(100dvh-6rem)] md:w-96 md:p-0 md:pb-0">
            <AddMemoryForm
              initial={editingMemory}
              onSave={handleSave}
              onCancel={() => setEditingMemory(null)}
              onDelete={handleDeleteFromEditor}
            />
          </div>
        </div>
      )}
    </>
  );
}
