export const SHOW_HIDDEN_PHOTOS_STORAGE_KEY = "liebeskarte-show-hidden-photos";
export const SHOW_HIDDEN_PHOTOS_DURATION_MS = 60 * 60 * 1000;

interface StoredShowHiddenPhotos {
  enabled: boolean;
  expiresAt: number | null;
}

function readStored(): StoredShowHiddenPhotos | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(SHOW_HIDDEN_PHOTOS_STORAGE_KEY);
  if (!raw) return null;

  if (raw === "true" || raw === "false") {
    localStorage.removeItem(SHOW_HIDDEN_PHOTOS_STORAGE_KEY);
    return null;
  }

  try {
    return JSON.parse(raw) as StoredShowHiddenPhotos;
  } catch {
    localStorage.removeItem(SHOW_HIDDEN_PHOTOS_STORAGE_KEY);
    return null;
  }
}

export function clearStoredShowHiddenPhotos(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SHOW_HIDDEN_PHOTOS_STORAGE_KEY);
}

export function getStoredShowHiddenPhotosExpiresAt(): number | null {
  const stored = readStored();
  if (!stored?.enabled || !stored.expiresAt) return null;
  if (Date.now() >= stored.expiresAt) {
    clearStoredShowHiddenPhotos();
    return null;
  }
  return stored.expiresAt;
}

export function getStoredShowHiddenPhotos(): boolean {
  return getStoredShowHiddenPhotosExpiresAt() !== null;
}

export function setStoredShowHiddenPhotos(value: boolean): void {
  if (typeof window === "undefined") return;

  if (!value) {
    clearStoredShowHiddenPhotos();
    return;
  }

  const payload: StoredShowHiddenPhotos = {
    enabled: true,
    expiresAt: Date.now() + SHOW_HIDDEN_PHOTOS_DURATION_MS,
  };
  localStorage.setItem(SHOW_HIDDEN_PHOTOS_STORAGE_KEY, JSON.stringify(payload));
}

export function getShowHiddenPhotosRemainingMs(): number {
  const expiresAt = getStoredShowHiddenPhotosExpiresAt();
  if (!expiresAt) return 0;
  return Math.max(0, expiresAt - Date.now());
}
