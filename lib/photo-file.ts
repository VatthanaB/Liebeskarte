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

async function canvasToJpegFile(
  source: CanvasImageSource,
  width: number,
  height: number,
  file: File,
): Promise<File | null> {
  if (typeof document === "undefined" || width < 1 || height < 1) return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9),
  );
  return blob ? asJpegFile(blob, file) : null;
}

/** Safari/iOS can decode HEIC natively; Chrome and Firefox cannot. */
async function convertWithBitmap(file: File): Promise<File | null> {
  if (typeof createImageBitmap !== "function") return null;
  try {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      bitmap = await createImageBitmap(file);
    }
    const converted = await canvasToJpegFile(bitmap, bitmap.width, bitmap.height, file);
    bitmap.close();
    return converted;
  } catch {
    return null;
  }
}

/** Safari can also decode HEIC via an <img>, which sometimes works when createImageBitmap does not. */
async function convertWithImageElement(file: File): Promise<File | null> {
  if (typeof Image === "undefined") return null;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("decode failed"));
      image.src = url;
    });
    return await canvasToJpegFile(img, img.naturalWidth, img.naturalHeight, file);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function convertWithHeicTo(file: File): Promise<File> {
  const { heicTo } = await import("heic-to/csp");
  const blob = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 0.9,
  });
  return asJpegFile(blob, file);
}

/** Convert HEIC/HEIF camera photos to JPEG so every browser can preview and display them. */
export async function preparePhotoFile(file: File): Promise<File> {
  const maybeHeic = looksLikeHeic(file) || (await sniffHeic(file));
  if (!maybeHeic) return file;

  const native = (await convertWithBitmap(file)) ?? (await convertWithImageElement(file));
  if (native) return native;

  try {
    return await convertWithHeicTo(file);
  } catch (error) {
    console.error("[atlas] HEIC conversion failed", error);
    throw new Error("Couldn't read a HEIC photo. Try exporting it as JPEG.");
  }
}
