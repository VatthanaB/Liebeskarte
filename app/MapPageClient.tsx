"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapCanvas } from "@/components/MapCanvas";
import { GalleryCanvas } from "@/components/GalleryCanvas";
import { MemoryCard } from "@/components/MemoryCard";
import { MemoryStack } from "@/components/MemoryStack";
import { AddMemoryForm } from "@/components/AddMemoryForm";
import { NavBar } from "@/components/NavBar";
import { useMemories } from "@/lib/useMemories";
import { deleteMemory } from "@/lib/db";
import { findLocationGroup } from "@/lib/location-groups";
import { sharedMemories } from "@/lib/memory-visibility";
import type { Memory } from "@/lib/types";

type ViewMode = "map" | "gallery";

export default function MapPageClient() {
  console.log("[atlas:page] MapPageClient render start");
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const viewMode: ViewMode =
    viewParam === "gallery" || viewParam === "globe" ? "gallery" : "map";
  const { memories, loading, photoUrlMap, reload } = useMemories();
  console.log("[atlas:page] memories", {
    loading,
    count: memories.length,
    ids: memories.map((memory) => memory.id),
  });
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formInitial, setFormInitial] = useState<
    (Partial<Memory> & { lat: number; lng: number }) | undefined
  >(undefined);
  const [flyToId, setFlyToId] = useState<string | null>(null);

  useEffect(() => {
    console.log("[atlas:page] MapPageClient mounted");
    const memoryId = searchParams.get("memory");
    if (memoryId && memories.length > 0) {
      const memory = memories.find((item) => item.id === memoryId);
      if (memory) {
        setSelectedMemory(memory);
        setFlyToId(memoryId);
      }
    }
  }, [searchParams, memories]);

  const galleryMemories = useMemo(() => sharedMemories(memories), [memories]);

  const selectedGroup = useMemo(
    () => (selectedMemory ? findLocationGroup(memories, selectedMemory) : []),
    [memories, selectedMemory]
  );

  const handleSelectMemory = useCallback((memory: Memory) => {
    setSelectedMemory(memory);
    setShowForm(false);
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setFormInitial({ lat, lng });
    setShowForm(true);
    setSelectedMemory(null);
  }, []);

  const handleAddNew = useCallback(() => {
    setFormInitial({
      lat: -36.8485,
      lng: 174.7633,
      placeName: "Auckland",
      address: "Auckland, New Zealand",
    });
    setShowForm(true);
    setSelectedMemory(null);
  }, []);

  const handleSave = useCallback(
    (memory: Memory) => {
      setShowForm(false);
      setFormInitial(undefined);
      reload();
      setSelectedMemory(memory);
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
    if (!confirm("Delete this memory? This cannot be undone.")) return;
    const remaining = selectedGroup.filter(
      (memory) => memory.id !== selectedMemory.id
    );
    await deleteMemory(selectedMemory.id);
    setShowForm(false);
    setFormInitial(undefined);
    setSelectedMemory(remaining[remaining.length - 1] ?? null);
    reload();
  }, [selectedMemory, selectedGroup, reload]);

  const panelOpen = showForm || !!selectedMemory;

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
            controlsOffset={panelOpen ? 280 : 0}
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
            controlsOffset={panelOpen ? 280 : 0}
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-[1000]">
        <NavBar
          viewMode={viewMode}
          onAddMemory={panelOpen ? undefined : handleAddNew}
        />
      </div>

      {loading && (
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
          <p style={{ color: "var(--theme-ink-muted)" }}>Loading Liebeskarte...</p>
        </div>
      )}

      {panelOpen && (
        <div className="absolute bottom-0 left-0 right-0 z-[1100] max-h-[70vh] overflow-x-hidden overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:bottom-auto md:left-auto md:top-20 md:right-6 md:max-h-[calc(100dvh-6rem)] md:w-96 md:p-0 md:pb-0">
          {showForm && formInitial ? (
            <AddMemoryForm
              initial={formInitial}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setFormInitial(undefined);
              }}
              onDelete={formInitial.id ? handleDelete : undefined}
            />
          ) : selectedMemory && selectedGroup.length > 1 ? (
            <MemoryStack
              memories={selectedGroup}
              selectedId={selectedMemory.id}
              photoUrlMap={photoUrlMap}
              onSelect={handleSelectMemory}
              onClose={() => setSelectedMemory(null)}
              onEdit={handleEdit}
            />
          ) : selectedMemory ? (
            <MemoryCard
              memory={selectedMemory}
              photoUrls={photoUrlMap[selectedMemory.id] ?? []}
              onClose={() => setSelectedMemory(null)}
              onEdit={handleEdit}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
