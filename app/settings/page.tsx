"use client";

import { NavBar } from "@/components/NavBar";
import { PartnerIndicator } from "@/components/PartnerIndicator";
import { PhotoManager } from "@/components/PhotoManager";
import { ShowHiddenPhotosSetting } from "@/components/ShowHiddenPhotosSetting";
import { useMemories } from "@/lib/useMemories";
import { LoveLoading } from "@/components/LoveLoading";

export default function SettingsPage() {
  const { memories, loading } = useMemories();

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-[max(5rem,calc(env(safe-area-inset-top)+3.5rem))] md:px-8">
        <div className="mb-8">
          <h1
            className="mb-2 text-3xl font-semibold md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Settings
          </h1>
          <p style={{ color: "var(--theme-ink-muted)" }}>
            Manage shared and personal photos. Hidden photos stay off the map, gallery, timeline,
            and shared album unless you turn on show hidden photos below (it turns off automatically
            after 1 hour).
          </p>
        </div>

        <PartnerIndicator />

        <ShowHiddenPhotosSetting />

        <section>
          <h2
            className="mb-4 text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Photo management
          </h2>
          {loading ? (
            <LoveLoading />
          ) : (
            <PhotoManager memories={memories} />
          )}
        </section>
      </main>
    </div>
  );
}
