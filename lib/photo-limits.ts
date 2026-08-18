import { looksLikeHeic } from "./photo-file";

/** Max upload size before HEIC conversion (15 MB). */
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const ALLOWED_EXT = /\.(jpe?g|png|webp|gif|heic|heif)$/i;

export function validatePhotoFile(file: File): string | null {
  if (file.size > MAX_PHOTO_BYTES) {
    const mb = Math.round(MAX_PHOTO_BYTES / (1024 * 1024));
    return `Each photo must be under ${mb} MB.`;
  }

  const type = file.type.toLowerCase();
  if (
    type &&
    !ALLOWED_MIME.has(type) &&
    !looksLikeHeic(file) &&
    !ALLOWED_EXT.test(file.name)
  ) {
    return "Only image files (JPEG, PNG, WebP, GIF, HEIC) are allowed.";
  }

  if (!type && !looksLikeHeic(file) && !ALLOWED_EXT.test(file.name)) {
    return "Only image files (JPEG, PNG, WebP, GIF, HEIC) are allowed.";
  }

  return null;
}
