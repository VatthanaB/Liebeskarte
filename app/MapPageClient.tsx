"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapCanvas } from "@/components/MapCanvas";
import { GlobeCanvas } from "@/components/GlobeCanvas";
import { MemoryCard } from "@/components/MemoryCard";
import { AddMemoryForm } from "@/components/AddMemoryForm";
import { NavBar } from "@/components/NavBar";
import { useMemories } from "@/lib/useMemories";
import { deleteMemory } from "@/lib/db";
import type { Memory } from "@/lib/types";

type ViewMode = "map" | "globe";

export default function MapPageClient() {
  console.log("[atlas:page] MapPageClient render start");
  const searchParams = useSearchParams();
  const viewMode: ViewMode =
    searchParams.get("view") === "globe" ? "globe" : "map";
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
    await deleteMemory(selectedMemory.id);
    setSelectedMemory(null);
    reload();
  }, [selectedMemory, reload]);

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
          <GlobeCanvas
            memories={memories}
            selectedId={selectedMemory?.id}
            onSelectMemory={handleSelectMemory}
            onMapClick={handleMapClick}
            flyToId={flyToId}
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-[1000]">
        <NavBar viewMode={viewMode} />
      </div>

      {loading && (
        <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
          <p style={{ color: "var(--theme-ink-muted)" }}>Loading Liebeskarte...</p>
        </div>
      )}

      {!showForm && !selectedMemory && (
        <button
          onClick={handleAddNew}
          className="absolute top-[max(6rem,calc(env(safe-area-inset-top)+4rem))] right-4 z-[1000] rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 md:right-6"
          style={{
            backgroundColor: "var(--theme-accent)",
            fontFamily: "var(--font-label)",
          }}
        >
          + Add memory
        </button>
      )}

      {panelOpen && (
        <div className="absolute bottom-0 left-0 right-0 z-[1100] max-h-[70vh] overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:bottom-auto md:left-auto md:top-20 md:right-6 md:max-h-[calc(100dvh-6rem)] md:w-96 md:p-0 md:pb-0">
          {showForm && formInitial ? (
            <AddMemoryForm
              initial={formInitial}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setFormInitial(undefined);
              }}
            />
          ) : selectedMemory ? (
            <div className="space-y-2">
              <MemoryCard
                memory={selectedMemory}
                photoUrls={photoUrlMap[selectedMemory.id] ?? []}
                onClose={() => setSelectedMemory(null)}
                onEdit={handleEdit}
              />
              <button
                onClick={handleDelete}
                className="w-full rounded-lg py-2 text-sm text-red-500 hover:bg-red-50"
              >
                Delete memory
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
