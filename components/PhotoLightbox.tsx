"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import type { Memory } from "@/lib/types";
import { formatShortDate } from "@/lib/photos";
import { useFocusTrap } from "@/lib/useFocusTrap";

export interface LightboxPhoto {
  url: string;
  memory: Memory;
}

interface PhotoLightboxProps {
  photos: LightboxPhoto[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PhotoLightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: PhotoLightboxProps) {
  const current = photos[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose);

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(currentIndex - 1);
  }, [currentIndex, hasPrev, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(currentIndex + 1);
  }, [currentIndex, hasNext, onNavigate]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!current) return null;

  const { memory, url } = current;
  const chromeTop = "max(1.5rem, env(safe-area-inset-top))";
  const chromeSide = "max(1rem, env(safe-area-inset-left))";

  return (
    <div
      ref={dialogRef}
      className="photo-lightbox fixed inset-0 z-[2000] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo: ${memory.title}`}
      onClick={onClose}
    >
      <div className="photo-lightbox__backdrop absolute inset-0 bg-black/75" />

      <button
        type="button"
        onClick={onClose}
        className="absolute z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full text-2xl leading-none text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        style={{ top: chromeTop, right: "max(1.5rem, env(safe-area-inset-right))" }}
        aria-label="Close"
      >
        ×
      </button>

      {hasPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="photo-lightbox__nav absolute z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full text-2xl text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 md:left-8"
          style={{ top: "50%", transform: "translateY(-50%)", left: chromeSide }}
          aria-label="Previous photo"
        >
          ‹
        </button>
      )}

      {hasNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="photo-lightbox__nav absolute z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full text-2xl text-white/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 md:right-8"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            right: "max(1rem, env(safe-area-inset-right))",
          }}
          aria-label="Next photo"
        >
          ›
        </button>
      )}

      <div
        className="photo-lightbox__content relative z-10 mx-4 flex max-h-[90vh] max-w-4xl flex-col pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={`${memory.title}, ${formatShortDate(memory.date)}`}
          className="max-h-[70vh] w-full rounded-lg object-contain shadow-2xl"
        />

        <div
          className="mt-4 rounded-xl border p-4"
          style={{
            borderColor: "var(--theme-border)",
            backgroundColor: "var(--theme-surface)",
          }}
        >
          <h3
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {memory.title}
          </h3>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
          >
            {formatShortDate(memory.date)} · {memory.placeName}
          </p>
          {memory.address && memory.address !== memory.placeName && (
            <p className="mt-0.5 text-xs leading-snug" style={{ color: "var(--theme-ink-muted)" }}>
              {memory.address}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/?memory=${memory.id}`}
              className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-xs font-medium text-white"
              style={{ backgroundColor: "var(--theme-accent)" }}
            >
              View on map
            </Link>
            <Link
              href="/timeline"
              className="inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-xs font-medium"
              style={{
                borderColor: "var(--theme-border)",
                color: "var(--theme-ink-muted)",
              }}
            >
              View on timeline
            </Link>
          </div>

          {photos.length > 1 && (
            <p
              className="mt-3 text-xs"
              style={{ color: "var(--theme-ink-muted)" }}
            >
              {currentIndex + 1} of {photos.length}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
