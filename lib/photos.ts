import type { Memory, MilestoneType } from "./types";

export interface PhotoEntry {
  url: string;
  memoryId: string;
  memory: Memory;
  photoIndex: number;
}

export interface YearGroup {
  year: number;
  memories: Memory[];
}

export function getMemoryYear(memory: Memory): number {
  return new Date(memory.date).getFullYear();
}

export function groupMemoriesByYear(memories: Memory[]): YearGroup[] {
  const groups = new Map<number, Memory[]>();

  for (const memory of memories) {
    const year = getMemoryYear(memory);
    const existing = groups.get(year) ?? [];
    existing.push(memory);
    groups.set(year, existing);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, yearMemories]) => ({ year, memories: yearMemories }));
}

export function flattenPhotos(
  memories: Memory[],
  photoUrlMap: Record<string, string[]>,
): PhotoEntry[] {
  const entries: PhotoEntry[] = [];

  for (const memory of memories) {
    const urls = photoUrlMap[memory.id] ?? [];
    urls.forEach((url, photoIndex) => {
      entries.push({ url, memoryId: memory.id, memory, photoIndex });
    });
  }

  return entries;
}

export function getUniqueYears(memories: Memory[]): number[] {
  return [...new Set(memories.map(getMemoryYear))].sort((a, b) => a - b);
}

export function filterPhotosByYear(
  entries: PhotoEntry[],
  year: number | null,
): PhotoEntry[] {
  if (year === null) return entries;
  return entries.filter((entry) => getMemoryYear(entry.memory) === year);
}

export function filterPhotosByType(
  entries: PhotoEntry[],
  type: MilestoneType | null,
): PhotoEntry[] {
  if (type === null) return entries;
  return entries.filter((entry) => entry.memory.type === type);
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatYear(dateStr: string): string {
  return String(new Date(dateStr).getFullYear());
}

/** Stable tilt angle from a string id (-2 to 2 degrees). */
export function cardTilt(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % 5;
  }
  return hash - 2;
}

/** Aspect ratio class for mosaic tiles. */
export function mosaicAspect(index: number): string {
  const aspects = ["aspect-[4/5]", "aspect-square", "aspect-[5/4]", "aspect-[3/4]"];
  return aspects[index % aspects.length];
}
