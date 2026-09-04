import { PHOTO_BUCKET } from "./types";

const CACHE_NAME = "liebeskarte-photos-v1";

/** Extract storage path from a Supabase signed URL for memory-photos bucket. */
export function extractPhotoPathFromSignedUrl(signedUrl: string): string | null {
  try {
    const url = new URL(signedUrl);
    const marker = `/object/sign/${PHOTO_BUCKET}/`;
    const index = url.pathname.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

function cacheKeyForPath(path: string): string {
  return `${PHOTO_BUCKET}/${path}`;
}

async function openCache(): Promise<Cache | null> {
  if (typeof caches === "undefined") return null;
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

export async function getCachedPhotoBlob(path: string): Promise<Blob | null> {
  const cache = await openCache();
  if (!cache) return null;

  const response = await cache.match(cacheKeyForPath(path));
  if (!response?.ok) return null;

  try {
    return await response.blob();
  } catch {
    return null;
  }
}

export async function putCachedPhoto(path: string, blob: Blob, contentType?: string): Promise<void> {
  const cache = await openCache();
  if (!cache) return;

  try {
    const response = new Response(blob, {
      headers: {
        "Content-Type": contentType ?? blob.type ?? "image/jpeg",
      },
    });
    await cache.put(cacheKeyForPath(path), response);
  } catch {
    // Cache Storage may be unavailable or quota exceeded.
  }
}

export async function invalidateCachedPhoto(path: string): Promise<void> {
  const cache = await openCache();
  if (!cache) return;

  try {
    await cache.delete(cacheKeyForPath(path));
  } catch {
    // Ignore cache deletion failures.
  }
}

export async function resolvePhotoDisplayUrl(
  signedUrl: string,
  pathHint?: string | null,
): Promise<string> {
  if (!signedUrl || signedUrl.startsWith("blob:") || signedUrl.startsWith("data:")) {
    return signedUrl;
  }

  const path = pathHint ?? extractPhotoPathFromSignedUrl(signedUrl);
  if (!path) return signedUrl;

  const cachedBlob = await getCachedPhotoBlob(path);
  if (cachedBlob) {
    return URL.createObjectURL(cachedBlob);
  }

  try {
    const response = await fetch(signedUrl);
    if (!response.ok) return signedUrl;

    const blob = await response.blob();
    void putCachedPhoto(path, blob, response.headers.get("Content-Type") ?? blob.type);
    return URL.createObjectURL(blob);
  } catch {
    return signedUrl;
  }
}
