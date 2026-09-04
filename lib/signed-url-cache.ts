export const SIGNED_URL_TTL_SEC = 60 * 60 * 24;
/** Refresh cached URLs one hour before expiry. */
export const SIGNED_URL_REFRESH_BUFFER_MS = 60 * 60 * 1000;

const SIGNED_URL_STORAGE_KEY = "liebeskarte-signed-urls";

interface SignedUrlEntry {
  url: string;
  expiresAt: number;
}

type SignedUrlStore = Record<string, SignedUrlEntry>;

const signedUrlCache = new Map<string, SignedUrlEntry>();
let storageHydrated = false;

function isFresh(entry: SignedUrlEntry): boolean {
  return entry.expiresAt > Date.now() + SIGNED_URL_REFRESH_BUFFER_MS;
}

function hydrateFromSessionStorage(): void {
  if (storageHydrated || typeof window === "undefined") return;
  storageHydrated = true;

  const raw = sessionStorage.getItem(SIGNED_URL_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as SignedUrlStore;
    for (const [path, entry] of Object.entries(parsed)) {
      if (isFresh(entry)) {
        signedUrlCache.set(path, entry);
      }
    }
  } catch {
    sessionStorage.removeItem(SIGNED_URL_STORAGE_KEY);
  }
}

function persistToSessionStorage(): void {
  if (typeof window === "undefined") return;

  const payload: SignedUrlStore = {};
  for (const [path, entry] of signedUrlCache.entries()) {
    if (isFresh(entry)) {
      payload[path] = entry;
    }
  }

  if (Object.keys(payload).length === 0) {
    sessionStorage.removeItem(SIGNED_URL_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(SIGNED_URL_STORAGE_KEY, JSON.stringify(payload));
}

export function getCachedSignedUrl(path: string): string | null {
  hydrateFromSessionStorage();
  const cached = signedUrlCache.get(path);
  if (cached && isFresh(cached)) {
    return cached.url;
  }
  return null;
}

export function setCachedSignedUrl(path: string, url: string, expiresAt: number): void {
  hydrateFromSessionStorage();
  signedUrlCache.set(path, { url, expiresAt });
  persistToSessionStorage();
}

export function invalidateSignedUrl(path: string): void {
  hydrateFromSessionStorage();
  signedUrlCache.delete(path);
  persistToSessionStorage();
}

export function partitionSignedUrlPaths(paths: string[]): {
  cached: Map<string, string>;
  missing: string[];
} {
  hydrateFromSessionStorage();
  const cached = new Map<string, string>();
  const missing: string[] = [];

  for (const path of paths) {
    const url = getCachedSignedUrl(path);
    if (url) {
      cached.set(path, url);
    } else {
      missing.push(path);
    }
  }

  return { cached, missing };
}
