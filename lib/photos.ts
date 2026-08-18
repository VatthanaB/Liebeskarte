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

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const MONTH_SHORT_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function getMemoryYear(memory: Memory): number {
  return new Date(memory.date).getFullYear();
}

/** Calendar month 1–12 from the memory date. */
export function getMemoryMonth(memory: Memory): number {
  return new Date(memory.date).getMonth() + 1;
}

export interface MonthGroup {
  year: number;
  month: number;
  label: string;
  photos: PhotoEntry[];
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

export function getUniqueMonths(
  memories: Memory[],
  year: number | null = null,
): number[] {
  const scoped =
    year === null ? memories : memories.filter((memory) => getMemoryYear(memory) === year);
  return [...new Set(scoped.map(getMemoryMonth))].sort((a, b) => a - b);
}

export function filterPhotosByYear(
  entries: PhotoEntry[],
  year: number | null,
): PhotoEntry[] {
  if (year === null) return entries;
  return entries.filter((entry) => getMemoryYear(entry.memory) === year);
}

export function filterPhotosByMonth(
  entries: PhotoEntry[],
  month: number | null,
): PhotoEntry[] {
  if (month === null) return entries;
  return entries.filter((entry) => getMemoryMonth(entry.memory) === month);
}

export function groupPhotosByMonth(entries: PhotoEntry[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();

  for (const entry of entries) {
    const year = getMemoryYear(entry.memory);
    const month = getMemoryMonth(entry.memory);
    const key = `${year}-${month}`;
    const existing = groups.get(key);
    if (existing) {
      existing.photos.push(entry);
    } else {
      groups.set(key, {
        year,
        month,
        label: `${MONTH_LABELS[month - 1]} ${year}`,
        photos: [entry],
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
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
