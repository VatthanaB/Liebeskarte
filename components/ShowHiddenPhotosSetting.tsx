"use client";

import { useEffect, useState } from "react";
import { getShowHiddenPhotosRemainingMs } from "@/lib/show-hidden-photos";
import { useShowHiddenPhotos } from "./ShowHiddenPhotosProvider";

function formatRemaining(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60_000);
  if (totalMinutes <= 1) return "about 1 minute";
  if (totalMinutes < 60) return `${totalMinutes} minutes`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `${hours}h ${minutes}m`;
}

export function ShowHiddenPhotosSetting() {
  const { showHiddenPhotos, setShowHiddenPhotos } = useShowHiddenPhotos();
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!showHiddenPhotos) {
      setRemainingMs(0);
      return;
    }

    function updateRemaining() {
      setRemainingMs(getShowHiddenPhotosRemainingMs());
    }

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 30_000);
    return () => window.clearInterval(timer);
  }, [showHiddenPhotos]);

  return (
    <section
      className="mb-10 rounded-xl border p-4 md:p-5"
      style={{ borderColor: "var(--theme-border)", backgroundColor: "var(--theme-surface)" }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2
            id="show-hidden-heading"
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Show hidden photos
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
            When on, hidden photos appear on the map, gallery, timeline, and album. This turns off
            automatically after 1 hour.
          </p>
          {showHiddenPhotos && remainingMs > 0 && (
            <p className="mt-2 text-xs" style={{ color: "var(--theme-ink-muted)" }}>
              Turns off in {formatRemaining(remainingMs)}.
            </p>
          )}
        </div>
        <div className="flex min-h-11 shrink-0 items-center gap-3 self-start sm:self-center">
          <span
            id="show-hidden-status"
            className="text-sm font-medium"
            style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
          >
            {showHiddenPhotos ? "On" : "Off"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={showHiddenPhotos}
            aria-labelledby="show-hidden-heading show-hidden-status"
            onClick={() => setShowHiddenPhotos(!showHiddenPhotos)}
            className="relative h-11 w-[3.25rem] shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: showHiddenPhotos
                ? "var(--theme-accent)"
                : "var(--theme-border)",
            }}
          >
            <span
              className="absolute top-1 left-1 h-9 w-9 rounded-full bg-white shadow transition-transform"
              style={{
                transform: showHiddenPhotos ? "translateX(1.25rem)" : "translateX(0)",
              }}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
