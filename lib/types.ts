export type MilestoneType =
  | "met"
  | "date"
  | "trip"
  | "home"
  | "celebration"
  | "custom";

export interface Memory {
  id: string;
  title: string;
  date: string;
  lat: number;
  lng: number;
  placeName: string;
  address: string;
  type: MilestoneType;
  journal: string;
  photoIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  memoryId: string;
  name: string;
  path: string;
  url: string;
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
