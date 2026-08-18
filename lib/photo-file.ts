const HEIC_MIME = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "mif1", "msf1"]);

export function looksLikeHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return HEIC_MIME.has(type) || name.endsWith(".heic") || name.endsWith(".heif");
}

function jpegName(file: File): string {
  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  return `${base}.jpg`;
}

function asJpegFile(blob: Blob, file: File): File {
  return new File([blob], jpegName(file), { type: "image/jpeg" });
}

async function sniffHeic(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (bytes.length < 12) return false;
  const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
  const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  return ftyp === "ftyp" && HEIC_BRANDS.has(brand);
}

/** Safari/iOS can decode HEIC natively; Chrome and Firefox cannot. */
async function convertWithBitmap(file: File): Promise<File | null> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    return null;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9)
    );
    return blob ? asJpegFile(blob, file) : null;
  } catch {
    return null;
  }
}

const KNOWN_RASTER = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/** Convert HEIC/HEIF camera photos to JPEG so every browser can preview and display them. */
export async function preparePhotoFile(file: File): Promise<File> {
  const type = file.type.toLowerCase();
  const maybeHeic =
    looksLikeHeic(file) ||
    (!KNOWN_RASTER.has(type) && (await sniffHeic(file)));
  if (!maybeHeic) return file;

  const native = await convertWithBitmap(file);
  if (native) return native;

  const { heicTo } = await import("heic-to");
  const blob = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 0.9,
  });
  return asJpegFile(blob, file);
}
