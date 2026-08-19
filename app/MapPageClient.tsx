"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapCanvas } from "@/components/MapCanvas";
import { GalleryCanvas } from "@/components/GalleryCanvas";
import { MemoryCard } from "@/components/MemoryCard";
import { MemoryStack } from "@/components/MemoryStack";
import { AddMemoryForm } from "@/components/AddMemoryForm";
import { NavBar } from "@/components/NavBar";
import { DataErrorBanner } from "@/components/DataErrorBanner";
import { useMemories } from "@/lib/useMemories";
import { deleteMemory } from "@/lib/db";
import { findLocationGroup } from "@/lib/location-groups";
import { sharedMemories } from "@/lib/memory-visibility";
import { seedDemoMemories } from "@/lib/seed-demo";
import { LoveLoading } from "@/components/LoveLoading";
import { useConfirm } from "@/components/ConfirmDialog";
import type { Memory } from "@/lib/types";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

type ViewMode = "map" | "gallery";

export default function MapPageClient() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const viewMode: ViewMode =
    viewParam === "gallery" || viewParam === "globe" ? "gallery" : "map";
  const { memories, loading, error, photoUrlMap, reload } = useMemories();
  const confirm = useConfirm();
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formInitial, setFormInitial] = useState<
    (Partial<Memory> & { lat: number; lng: number }) | undefined
  >(undefined);
  const [flyToId, setFlyToId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const canSeedDemo = process.env.NODE_ENV === "development";

  const selectedMemory = useMemo(
    () => (selectedId ? memories.find((item) => item.id === selectedId) ?? null : null),
    [memories, selectedId]
  );

  const memoryParam = searchParams.get("memory");
  const [appliedParam, setAppliedParam] = useState<string | null>(null);
  if (memoryParam !== appliedParam) {
    setAppliedParam(memoryParam);
    if (memoryParam) {
      setSelectedId(memoryParam);
      setFlyToId(memoryParam);
    }
  }

  const galleryMemories = useMemo(() => sharedMemories(memories), [memories]);

  const selectedGroup = useMemo(
    () => (selectedMemory ? findLocationGroup(memories, selectedMemory) : []),
    [memories, selectedMemory]
  );

  const handleSelectMemory = useCallback((memory: Memory) => {
    setSelectedId(memory.id);
    setShowForm(false);
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setFormInitial({ lat, lng });
    setShowForm(true);
    setSelectedId(null);
  }, []);

  const handleAddNew = useCallback(() => {
    setFormInitial({
      lat: -36.8485,
      lng: 174.7633,
      placeName: "Auckland",
      address: "Auckland, New Zealand",
    });
    setShowForm(true);
    setSelectedId(null);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setShowForm(false);
    setFormInitial(undefined);
  }, []);

  const handleSeedDemo = useCallback(async () => {
    setSeeding(true);
    setSeedError(null);
    try {
      await seedDemoMemories();
      await reload();
    } catch (err) {
      console.error("[atlas:seed] failed", err);
      setSeedError("Couldn't load the sample journey. Try again.");
    } finally {
      setSeeding(false);
    }
  }, [reload]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "Escape") {
        if (showForm) {
          handleCloseEditor();
          return;
        }
        if (selectedId) {
          setSelectedId(null);
        }
        return;
      }

      if (
        (event.key === "n" || event.key === "N") &&
        viewMode === "map" &&
        !showForm
      ) {
        event.preventDefault();
        handleAddNew();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleAddNew, handleCloseEditor, selectedId, showForm, viewMode]);

  const handleSave = useCallback(
    (memory: Memory) => {
      setShowForm(false);
      setFormInitial(undefined);
      reload();
      setSelectedId(memory.id);
    },
    [reload]
  );

  const handleEdit = useCallback(() => {
    if (!selectedMemory) return;
    setFormInitial(selectedMemory);
    setShowForm(true);
  }, [selectedMemory]);

  const handleDelete = useCallback(async () => {
    if (!selectedMemory) return;
    const confirmed = await confirm({
      title: "Delete this memory?",
      description: "This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;
    const remaining = selectedGroup.filter(
      (memory) => memory.id !== selectedMemory.id
    );
    await deleteMemory(selectedMemory.id);
    setShowForm(false);
    setFormInitial(undefined);
    setSelectedId(remaining[remaining.length - 1]?.id ?? null);
    reload();
  }, [selectedMemory, selectedGroup, reload, confirm]);

  const panelOpen = showForm || !!selectedMemory;
  const memoryPanelOpen = !!selectedMemory && !showForm;
  const showError = Boolean(error) && error !== dismissedError;
  const showMapEmpty =
    viewMode === "map" && !loading && !error && memories.length === 0 && !showForm;

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {viewMode === "map" ? (
        <div className="map-view-fade absolute inset-0 z-0">
          <MapCanvas
            memories={memories}
            selectedId={selectedMemory?.id}
            onSelectMemory={handleSelectMemory}
            onMapClick={handleMapClick}
            flyToId={flyToId}
            controlsOffset={memoryPanelOpen ? 280 : 0}
            hideControls={showForm}
          />
        </div>
      ) : (
        <div className="map-view-fade absolute inset-0 z-0">
          <GalleryCanvas
            memories={galleryMemories}
            photoUrlMap={photoUrlMap}
            selectedId={selectedMemory?.id}
            onSelectMemory={handleSelectMemory}
            flyToId={flyToId}
            hideControls={showForm}
            loading={loading}
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-[1000]">
        <NavBar
          viewMode={viewMode}
          onAddMemory={
            viewMode === "map" && !panelOpen ? handleAddNew : undefined
          }
        />
      </div>

      {loading && viewMode === "gallery" && memories.length === 0 && (
        <LoveLoading variant="overlay" />
      )}

      {showError && (
        <div className="pointer-events-none absolute inset-x-0 top-[max(5rem,calc(env(safe-area-inset-top)+3.5rem))] z-[1050] px-4">
          <DataErrorBanner
            message={error!}
            onRetry={() => reload({ silent: false })}
            onDismiss={() => setDismissedError(error!)}
          />
        </div>
      )}

      {showMapEmpty && (
        <div className="pointer-events-none absolute inset-0 z-[900] flex items-center justify-center p-6">
          <div
            className="pointer-events-auto max-w-sm rounded-xl border p-8 text-center shadow-sm backdrop-blur-sm"
            style={{
              borderColor: "var(--theme-border)",
              backgroundColor: "color-mix(in srgb, var(--theme-surface) 92%, transparent)",
            }}
          >
            <p
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Your map is waiting
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
              Pin your first memory — where you met, a favourite trip, or home.
            </p>
            <button
              type="button"
              onClick={handleAddNew}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full px-6 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--theme-accent)" }}
            >
              Add a memory
            </button>
            {canSeedDemo && (
              <button
                type="button"
                onClick={handleSeedDemo}
                disabled={seeding}
                className="mt-3 min-h-11 rounded-full border px-6 py-2 text-sm font-medium disabled:opacity-50"
                style={{
                  borderColor: "var(--theme-border)",
                  color: "var(--theme-ink)",
                }}
              >
                {seeding ? "Loading sample…" : "Preview sample journey"}
              </button>
            )}
            {seedError && (
              <p className="mt-3 text-xs text-red-600">{seedError}</p>
            )}
          </div>
        </div>
      )}

      {showForm && formInitial && (
        <div className="pointer-events-auto fixed inset-0 z-[1100] flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close editor"
            onClick={handleCloseEditor}
          />
          <div className="relative z-10 w-full max-w-md pointer-events-auto">
            <AddMemoryForm
              initial={formInitial}
              onSave={handleSave}
              onCancel={handleCloseEditor}
              onDelete={formInitial.id ? handleDelete : undefined}
            />
          </div>
        </div>
      )}

      {memoryPanelOpen && (
        <div className="absolute bottom-0 left-0 right-0 z-[1100] max-h-[70vh] overflow-x-hidden overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:bottom-auto md:left-auto md:top-20 md:right-6 md:max-h-[calc(100dvh-6rem)] md:w-96 md:p-0 md:pb-0">
          {selectedGroup.length > 1 ? (
            <MemoryStack
              memories={selectedGroup}
              selectedId={selectedMemory!.id}
              photoUrlMap={photoUrlMap}
              onSelect={handleSelectMemory}
              onClose={() => setSelectedId(null)}
              onEdit={handleEdit}
            />
          ) : (
            <MemoryCard
              memory={selectedMemory!}
              photoUrls={photoUrlMap[selectedMemory!.id] ?? []}
              onClose={() => setSelectedId(null)}
              onEdit={handleEdit}
            />
          )}
        </div>
      )}
    </div>
  );
}
