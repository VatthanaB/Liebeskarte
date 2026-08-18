"use client";

import { NavBar } from "@/components/NavBar";
import { AlbumGrid } from "@/components/AlbumGrid";
import { useMemories } from "@/lib/useMemories";
import { flattenPhotos } from "@/lib/photos";

export default function AlbumPage() {
  const { memories, loading, photoUrlMap } = useMemories();
  const photoCount = flattenPhotos(memories, photoUrlMap).length;

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-[max(5rem,calc(env(safe-area-inset-top)+3.5rem))] md:px-8">
        <div className="mb-8">
          <h1
            className="mb-2 text-3xl font-semibold md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Photo album
          </h1>
          <p style={{ color: "var(--theme-ink-muted)" }}>
            Every captured moment — tap a photo to relive the memory.
          </p>
        </div>

        {loading ? (
          <p style={{ color: "var(--theme-ink-muted)" }}>Loading...</p>
        ) : (
          <AlbumGrid memories={memories} photoUrlMap={photoUrlMap} />
        )}

        {!loading && photoCount > 0 && (
          <p
            className="mt-8 text-center text-xs uppercase tracking-wider"
            style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
          >
            {photoCount} {photoCount === 1 ? "photo" : "photos"} across {memories.length}{" "}
            {memories.length === 1 ? "memory" : "memories"}
          </p>
        )}
      </main>
    </div>
  );
}
