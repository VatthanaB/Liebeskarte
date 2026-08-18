"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { AddMemoryForm } from "@/components/AddMemoryForm";
import { TimelineJourney } from "@/components/TimelineJourney";
import { useMemories } from "@/lib/useMemories";
import { deleteMemory } from "@/lib/db";
import { sharedMemories } from "@/lib/memory-visibility";
import type { Memory } from "@/lib/types";

export default function TimelinePage() {
  const router = useRouter();
  const { memories, loading, photoUrlMap, reload } = useMemories();
  const sharedOnly = sharedMemories(memories);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  useEffect(() => {
    if (!editingMemory) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editingMemory]);

  function handleViewOnMap(memory: Memory) {
    router.push(`/?memory=${memory.id}`);
  }

  function handleSave(memory: Memory) {
    setEditingMemory(null);
    reload();
    const card = document.querySelector(`[data-memory-id="${memory.id}"]`);
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function handleDelete() {
    if (!editingMemory) return;
    if (!confirm("Delete this memory? This cannot be undone.")) return;
    await deleteMemory(editingMemory.id);
    setEditingMemory(null);
    reload();
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-[max(5rem,calc(env(safe-area-inset-top)+3.5rem))] md:px-8">
        <div className="mb-12">
          <h1
            className="mb-2 text-3xl font-semibold md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Our timeline
          </h1>
          <p style={{ color: "var(--theme-ink-muted)" }}>
            Every milestone in order — scroll through your story, click to explore.
          </p>
        </div>

        {loading ? (
          <p style={{ color: "var(--theme-ink-muted)" }}>Loading...</p>
        ) : sharedOnly.length === 0 ? (
          <div
            className="rounded-xl border p-8 text-center"
            style={{ borderColor: "var(--theme-border)" }}
          >
            <p className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              No memories yet
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
              Add your first memory on the map to start building your story.
            </p>
          </div>
        ) : (
          <TimelineJourney
            memories={sharedOnly}
            photoUrlMap={photoUrlMap}
            onViewOnMap={handleViewOnMap}
            onEdit={setEditingMemory}
          />
        )}

        <p
          className="mt-8 text-center text-xs uppercase tracking-wider"
          style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
        >
          {sharedOnly.length} {sharedOnly.length === 1 ? "memory" : "memories"} · Auckland to the world
        </p>
      </main>

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
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}
    </div>
  );
}
