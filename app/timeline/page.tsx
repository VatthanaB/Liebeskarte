"use client";

import { useRouter } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { TimelineJourney } from "@/components/TimelineJourney";
import { useMemories } from "@/lib/useMemories";
import type { Memory } from "@/lib/types";

export default function TimelinePage() {
  const router = useRouter();
  const { memories, loading, photoUrlMap } = useMemories();

  function handleViewOnMap(memory: Memory) {
    router.push(`/?memory=${memory.id}`);
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
        ) : memories.length === 0 ? (
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
            memories={memories}
            photoUrlMap={photoUrlMap}
            onViewOnMap={handleViewOnMap}
          />
        )}

        <p
          className="mt-8 text-center text-xs uppercase tracking-wider"
          style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
        >
          {memories.length} {memories.length === 1 ? "memory" : "memories"} · Auckland to the world
        </p>
      </main>
    </div>
  );
}
