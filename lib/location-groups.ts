import type { Memory } from "./types";
import { isPersonalMemory } from "./memory-visibility";

/** Same building / map-click jitter — not neighbourhood clustering. */
const CLUSTER_METERS = 15;
/** Same street name only clusters when pins are this close (avoids global name collisions). */
const STREET_CLUSTER_METERS = 500;
/** Drop geocode outliers when placing a shared pin. */
const MARKER_OUTLIER_METERS = 120;

const STREET_SUFFIXES: Record<string, string> = {
  road: "rd",
  rd: "rd",
  street: "st",
  st: "st",
  avenue: "ave",
  ave: "ave",
  terrace: "tce",
  tce: "tce",
  place: "pl",
  pl: "pl",
  lane: "ln",
  ln: "ln",
  drive: "dr",
  dr: "dr",
  way: "way",
  crescent: "cres",
  cres: "cres",
  parade: "pde",
  pde: "pde",
  boulevard: "blvd",
  blvd: "blvd",
};

const STREET_RE = new RegExp(
  String.raw`(\d+[a-z]?),?\s+([a-z0-9''./-]+(?:\s+[a-z0-9''./-]+){0,4}\s+(?:${Object.keys(STREET_SUFFIXES).join("|")}))\b`,
  "i"
);

const GENERIC_PLACE = /^(auckland|new zealand|france|germany)$/i;

export function streetAddressKey(memory: Memory): string | null {
  const text = `${memory.placeName}, ${memory.address}`.toLowerCase();
  const match = text.match(STREET_RE);
  if (!match) return null;

  const words = match[2].trim().split(/\s+/);
  const suffix = words.pop();
  if (!suffix) return null;
  const normalizedSuffix = STREET_SUFFIXES[suffix] ?? suffix;
  return `${match[1]} ${words.join(" ")} ${normalizedSuffix}`.replace(/\s+/g, " ").trim();
}

export function metersBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const earth = 6371000;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function sortByDate(group: Memory[]): Memory[] {
  return [...group].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function groupMemoriesByLocation(memories: Memory[]): Memory[][] {
  const count = memories.length;
  const parent = memories.map((_, index) => index);

  function find(index: number): number {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  }

  function union(left: number, right: number) {
    const a = find(left);
    const b = find(right);
    if (a !== b) parent[a] = b;
  }

  const byStreet = new Map<string, number[]>();
  for (let i = 0; i < count; i++) {
    const key = streetAddressKey(memories[i]);
    if (!key) continue;
    const list = byStreet.get(key);
    if (list) list.push(i);
    else byStreet.set(key, [i]);
  }
  for (const indices of byStreet.values()) {
    if (indices.length <= 1) continue;
    for (let i = 0; i < indices.length; i++) {
      for (let j = i + 1; j < indices.length; j++) {
        if (isPersonalMemory(memories[indices[i]]) || isPersonalMemory(memories[indices[j]])) {
          continue;
        }
        if (
          metersBetween(memories[indices[i]], memories[indices[j]]) <=
          STREET_CLUSTER_METERS
        ) {
          union(indices[i], indices[j]);
        }
      }
    }
  }

  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      if (isPersonalMemory(memories[i]) || isPersonalMemory(memories[j])) {
        continue;
      }
      if (metersBetween(memories[i], memories[j]) <= CLUSTER_METERS) {
        union(i, j);
      }
    }
  }

  const groups = new Map<number, Memory[]>();
  for (let i = 0; i < count; i++) {
    const root = find(i);
    const list = groups.get(root);
    if (list) list.push(memories[i]);
    else groups.set(root, [memories[i]]);
  }

  return [...groups.values()].map(sortByDate);
}

export function findLocationGroup(
  memories: Memory[],
  target: Memory
): Memory[] {
  if (isPersonalMemory(target)) return [target];

  const groups = groupMemoriesByLocation(memories);
  return (
    groups.find((group) => group.some((memory) => memory.id === target.id)) ?? [
      target,
    ]
  );
}

export function groupCenter(group: Memory[]): { lat: number; lng: number } {
  if (group.length === 0) return { lat: 0, lng: 0 };
  if (group.length === 1) {
    return { lat: group[0].lat, lng: group[0].lng };
  }

  const streetKey = streetAddressKey(group[0]);
  const keyed = streetKey
    ? group.filter((memory) => streetAddressKey(memory) === streetKey)
    : group;
  const points = keyed.length > 0 ? keyed : group;

  const lats = [...points.map((memory) => memory.lat)].sort((a, b) => a - b);
  const lngs = [...points.map((memory) => memory.lng)].sort((a, b) => a - b);
  const median = {
    lat: lats[Math.floor(lats.length / 2)],
    lng: lngs[Math.floor(lngs.length / 2)],
  };

  const nearby = points.filter(
    (memory) => metersBetween(memory, median) <= MARKER_OUTLIER_METERS
  );
  const use = nearby.length > 0 ? nearby : [points[points.length - 1]];

  return {
    lat: use.reduce((sum, memory) => sum + memory.lat, 0) / use.length,
    lng: use.reduce((sum, memory) => sum + memory.lng, 0) / use.length,
  };
}

export function groupPlaceLabel(group: Memory[]): string {
  const named = group
    .map((memory) => memory.placeName.trim())
    .filter((name) => name && !GENERIC_PLACE.test(name));

  if (named.length > 0) {
    const counts = new Map<string, number>();
    for (const name of named) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    let best = named[named.length - 1];
    let bestCount = 0;
    for (const [name, count] of counts) {
      if (count > bestCount) {
        best = name;
        bestCount = count;
      }
    }
    return best;
  }

  const street = group.map(streetAddressKey).find(Boolean);
  if (street) {
    return street.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return group[group.length - 1]?.placeName ?? "this place";
}
