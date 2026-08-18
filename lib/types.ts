export type MilestoneType =
  | "met"
  | "date"
  | "trip"
  | "home"
  | "celebration"
  | "custom";

export type PartnerId = "panda" | "henne";

export type MemoryVisibility = "shared" | "personal";

export const PARTNER_IDS: PartnerId[] = ["panda", "henne"];

export const PARTNERS: Record<PartnerId, { id: PartnerId; label: string }> = {
  panda: { id: "panda", label: "Panda" },
  henne: { id: "henne", label: "Henne" },
};

export interface JournalEntry {
  text: string;
  shared: boolean;
}

export interface Memory {
  id: string;
  title: string;
  date: string;
  lat: number;
  lng: number;
  placeName: string;
  address: string;
  type: MilestoneType;
  journals: Record<PartnerId, JournalEntry>;
  photoIds: string[];
  visibility: MemoryVisibility;
  owner: PartnerId | null;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  memoryId: string;
  name: string;
  path: string;
  url: string;
  hidden: boolean;
  createdAt: string;
}

export const MILESTONE_LABELS: Record<MilestoneType, string> = {
  met: "Where we met",
  date: "Date",
  trip: "Trip",
  home: "Home",
  celebration: "Celebration",
  custom: "Memory",
};

export const MILESTONE_ICONS: Record<MilestoneType, string> = {
  met: "✦",
  date: "♥",
  trip: "◎",
  home: "⌂",
  celebration: "★",
  custom: "•",
};

export const PHOTO_BUCKET = "memory-photos";
