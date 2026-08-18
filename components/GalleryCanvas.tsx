"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { Memory } from "@/lib/types";
import { MILESTONE_ICONS, MILESTONE_LABELS } from "@/lib/types";
import { formatShortDate } from "@/lib/photos";
import { WallBackdrop } from "@/components/WallBackdrop";

interface GalleryCanvasProps {
  memories: Memory[];
  photoUrlMap: Record<string, string[]>;
  selectedId?: string | null;
  onSelectMemory?: (memory: Memory) => void;
  flyToId?: string | null;
  hideControls?: boolean;
  loading?: boolean;
}

interface GalleryEntry {
  key: string;
  memory: Memory;
  photoUrl: string | null;
}

interface SlotLayout {
  top: string;
  left: string;
  width: string;
  z: number;
}

interface HangingPiece {
  instanceId: number;
  slotIndex: number;
  entry: GalleryEntry;
  tilt: number;
}

const SWAP_MS = 4500;
const HINT_MS = 5200;

const MOBILE_SLOTS: SlotLayout[] = [
  { top: "4%", left: "4%", width: "40%", z: 2 },
  { top: "14%", left: "56%", width: "40%", z: 3 },
  { top: "48%", left: "26%", width: "44%", z: 4 },
];

const DESKTOP_SLOTS: SlotLayout[] = [
  { top: "5%", left: "8%", width: "16%", z: 2 },
  { top: "1%", left: "26%", width: "18%", z: 4 },
  { top: "7%", left: "46%", width: "15%", z: 2 },
  { top: "3%", left: "64%", width: "16%", z: 3 },
  { top: "46%", left: "10%", width: "16%", z: 3 },
  { top: "42%", left: "28%", width: "19%", z: 5 },
  { top: "48%", left: "50%", width: "16%", z: 2 },
  { top: "44%", left: "68%", width: "16%", z: 3 },
];

function buildPool(
  memories: Memory[],
  photoUrlMap: Record<string, string[]>,
): GalleryEntry[] {
  const entries: GalleryEntry[] = [];

  for (const memory of memories) {
    const urls = photoUrlMap[memory.id] ?? [];
    if (urls.length === 0) continue;

    urls.forEach((url, index) => {
      entries.push({ key: `${memory.id}-${index}`, memory, photoUrl: url });
    });
  }

  return entries;
}

function randomTilt() {
  return Math.round((Math.random() * 10 - 5) * 10) / 10;
}

function pickEntry(
  pool: GalleryEntry[],
  hanging: HangingPiece[],
  preferMemoryId?: string | null,
): GalleryEntry | null {
  if (pool.length === 0) return null;

  if (preferMemoryId) {
    const preferred = pool.filter((entry) => entry.memory.id === preferMemoryId);
    if (preferred.length > 0) {
      return preferred[Math.floor(Math.random() * preferred.length)];
    }
  }

  const used = new Set(hanging.map((piece) => piece.entry.key));
  const unused = pool.filter((entry) => !used.has(entry.key));
  const candidates = unused.length > 0 ? unused : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

let pieceId = 0;

function nextPieceId() {
  pieceId += 1;
  return pieceId;
}

function fillWall(
  pool: GalleryEntry[],
  slotCount: number,
  preferMemoryId?: string | null,
): HangingPiece[] {
  const hanging: HangingPiece[] = [];
  const heroIndex = slotCount - 1;

  for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
    const prefer = slotIndex === heroIndex ? preferMemoryId : undefined;
    const entry = pickEntry(pool, hanging, prefer);
    if (!entry) break;
    hanging.push({
      instanceId: nextPieceId(),
      slotIndex,
      entry,
      tilt: randomTilt(),
    });
  }

  return hanging;
}

function useMediaFlag(query: string): boolean | null {
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export function GalleryCanvas({
  memories,
  photoUrlMap,
  selectedId,
  onSelectMemory,
  flyToId,
  hideControls = false,
  loading = false,
}: GalleryCanvasProps) {
  const isDesktop = useMediaFlag("(min-width: 768px)");
  const reduceMotion = useMediaFlag("(prefers-reduced-motion: reduce)");
  const slots = isDesktop ? DESKTOP_SLOTS : MOBILE_SLOTS;
  const layoutReady = isDesktop !== null && reduceMotion !== null;
  const pool = useMemo(
    () => buildPool(memories, photoUrlMap),
    [memories, photoUrlMap],
  );
  const [hanging, setHanging] = useState<HangingPiece[]>([]);
  const [hintTimedOut, setHintTimedOut] = useState(false);

  useEffect(() => {
    if (!layoutReady) return;

    const timer = window.setTimeout(() => {
      setHanging(pool.length === 0 ? [] : fillWall(pool, slots.length, flyToId));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [layoutReady, pool, slots.length, flyToId]);

  useEffect(() => {
    if (!layoutReady || reduceMotion !== false || selectedId || pool.length === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setHanging((current) => {
        if (current.length === 0) return current;
        const slotIndex = Math.floor(Math.random() * current.length);
        const others = current.filter((_, index) => index !== slotIndex);
        const entry = pickEntry(pool, others);
        if (!entry) return current;
        return current.map((piece) =>
          piece.slotIndex === slotIndex
            ? {
                instanceId: nextPieceId(),
                slotIndex,
                entry,
                tilt: randomTilt(),
              }
            : piece,
        );
      });
    }, SWAP_MS);

    return () => window.clearInterval(timer);
  }, [layoutReady, reduceMotion, selectedId, pool]);

  useEffect(() => {
    const timer = window.setTimeout(() => setHintTimedOut(true), HINT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const shuffle = useCallback(() => {
    if (pool.length === 0) return;
    setHanging(fillWall(pool, slots.length, selectedId));
  }, [pool, slots.length, selectedId]);

  const showEmpty = !loading && layoutReady && pool.length === 0;
  const showHint = !hintTimedOut && reduceMotion !== true && pool.length > 0 && !loading;
  const showShuffle = pool.length > 0 && !hideControls && !(selectedId && isDesktop !== true);

  const controlStyle = {
    backgroundColor: "var(--theme-surface)",
    borderColor: "var(--theme-border)",
    color: "var(--theme-ink)",
    fontFamily: "var(--font-label)",
  } as const;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <WallBackdrop />

      {showHint && pool.length > 0 && (
        <p
          className="gallery-hint pointer-events-none absolute left-4 right-20 text-center text-xs md:right-4"
          style={{
            top: "max(5.75rem, calc(env(safe-area-inset-top) + 4rem))",
            color: "var(--theme-ink-muted)",
            fontFamily: "var(--font-label)",
          }}
        >
          Memories wander onto the wall — tap a frame
        </p>
      )}

      {showEmpty && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-6"
        >
          <p
            className="max-w-sm text-center text-sm"
            style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-body)" }}
          >
            Add photos to your memories and they will drift onto this wall.
          </p>
        </div>
      )}

      <div className="gallery-stage">
        {hanging.map((piece) => {
          const slot = slots[piece.slotIndex];
          if (!slot) return null;
          const selected = piece.entry.memory.id === selectedId;
          const { memory, photoUrl } = piece.entry;

          return (
            <button
              key={piece.instanceId}
              type="button"
              className={`gallery-frame pointer-events-auto ${selected ? "gallery-frame--selected" : ""} ${reduceMotion ? "gallery-frame--still" : ""}`}
              style={{
                top: slot.top,
                left: slot.left,
                width: slot.width,
                zIndex: selected ? 20 : slot.z,
                "--tilt": `${piece.tilt}deg`,
              } as CSSProperties}
              onClick={() => onSelectMemory?.(memory)}
              aria-label={`${memory.title}, ${formatShortDate(memory.date)}, ${memory.placeName}`}
            >
              <span className="gallery-frame__nail" aria-hidden="true" />
              <span className="gallery-frame__wire" aria-hidden="true" />
              <div className="gallery-frame__mat">
                <span className="photo-tape photo-tape--tl" />
                {photoUrl ? (
                  <div className="gallery-frame__photo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrl} alt="" />
                  </div>
                ) : (
                  <div className="gallery-frame__plaque">
                    <span className="gallery-frame__icon">{MILESTONE_ICONS[memory.type]}</span>
                    <p className="gallery-frame__title">{memory.title}</p>
                    <p className="gallery-frame__type">{MILESTONE_LABELS[memory.type]}</p>
                  </div>
                )}
                <div className="gallery-frame__caption">
                  <p className="truncate">{memory.title}</p>
                  <p className="truncate opacity-70">
                    {formatShortDate(memory.date)} · {memory.placeName}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {showShuffle && (
        <div
          className="pointer-events-auto absolute left-4 z-[1000]"
          style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          <div
            className="flex items-center rounded-full border p-0.5 shadow-sm backdrop-blur-sm"
            style={controlStyle}
          >
            <button
              type="button"
              onClick={shuffle}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--theme-accent-light)] active:bg-[var(--theme-accent-light)]"
              aria-label="Shuffle photos"
              title="Shuffle"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M16 3h5v5" />
                <path d="m4 20 17-17" />
                <path d="M21 16v5h-5" />
                <path d="m15 15 6 6" />
                <path d="M4 4 9 9" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
