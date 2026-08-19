"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { PartnerIndicator } from "@/components/PartnerIndicator";
import { MemoryManager } from "@/components/MemoryManager";
import { PhotoManager } from "@/components/PhotoManager";
import { ShowHiddenPhotosSetting } from "@/components/ShowHiddenPhotosSetting";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { ReplayOnboardingSetting } from "@/components/ReplayOnboardingSetting";
import { DataErrorBanner } from "@/components/DataErrorBanner";
import { useMemories } from "@/lib/useMemories";
import { LoveLoading } from "@/components/LoveLoading";

type ManageTab = "memories" | "photos";

export default function SettingsPage() {
  const { memories, loading, error, photoUrlMap, reload } = useMemories();
  const [manageTab, setManageTab] = useState<ManageTab>("memories");
  const [dismissedError, setDismissedError] = useState<string | null>(null);

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
            Manage shared and personal content. Hidden photos stay off the map, gallery, timeline,
            and album unless you turn on show hidden photos below (auto-off after 1 hour).
          </p>
        </div>

        {error && error !== dismissedError && (
          <DataErrorBanner
            message={error}
            onRetry={reload}
            onDismiss={() => setDismissedError(error)}
          />
        )}

        <PartnerIndicator />

        <ShowHiddenPhotosSetting />

        <KeyboardShortcuts />

        <ReplayOnboardingSetting />

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Manage
            </h2>
            <div
              className="flex w-full flex-wrap gap-1 rounded-full border p-1 sm:w-auto"
              style={{ borderColor: "var(--theme-border)" }}
              role="tablist"
              aria-label="Manage content type"
            >
              {(
                [
                  { id: "memories" as const, label: "Memories" },
                  { id: "photos" as const, label: "Photos" },
                ] as const
              ).map(({ id, label }) => {
                const active = manageTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setManageTab(id)}
                    className="min-h-11 flex-1 rounded-full px-4 py-2 text-xs font-medium transition-colors sm:flex-none"
                    style={{
                      backgroundColor: active ? "var(--theme-accent)" : "transparent",
                      color: active ? "#fff" : "var(--theme-ink-muted)",
                      fontFamily: "var(--font-label)",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <LoveLoading />
          ) : manageTab === "memories" ? (
            <MemoryManager
              memories={memories}
              photoUrlMap={photoUrlMap}
              onReload={reload}
            />
          ) : (
            <PhotoManager memories={memories} />
          )}
        </section>
      </main>
    </div>
  );
}
