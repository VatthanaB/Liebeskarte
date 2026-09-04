import { invalidateCachedPhoto } from "./image-cache";
import { createClient } from "./supabase";
import { emptyJournals } from "./journals";
import { preparePhotoFile } from "./photo-file";
import { validatePhotoFile, MAX_PHOTO_BYTES } from "./photo-limits";
import {
  getCachedSignedUrl,
  invalidateSignedUrl,
  partitionSignedUrlPaths,
  setCachedSignedUrl,
  SIGNED_URL_TTL_SEC,
} from "./signed-url-cache";
import type {
  JournalEntry,
  Memory,
  MemoryVisibility,
  MilestoneType,
  PartnerId,
  Photo,
} from "./types";
import { PHOTO_BUCKET } from "./types";

interface MemoryRow {
  id: string;
  title: string;
  date: string;
  lat: number;
  lng: number;
  place_name: string;
  address: string;
  type: MilestoneType;
  journal?: string;
  journal_panda?: string;
  journal_henne?: string;
  journal_panda_shared?: boolean;
  journal_henne_shared?: boolean;
  visibility?: MemoryVisibility;
  owner?: PartnerId | null;
  created_at: string;
  updated_at: string;
}

interface PhotoRow {
  id: string;
  memory_id: string;
  path: string;
  name: string;
  hidden?: boolean;
  created_at: string;
}

function mapPhotoRow(row: PhotoRow, urlByPath: Map<string, string>): Photo {
  return {
    id: row.id,
    memoryId: row.memory_id,
    name: row.name,
    path: row.path,
    url: urlByPath.get(row.path) ?? "",
    hidden: row.hidden ?? false,
    createdAt: row.created_at,
  };
}

async function signPhotoPaths(paths: string[]): Promise<Map<string, string>> {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  const { cached, missing } = partitionSignedUrlPaths(uniquePaths);
  const urlByPath = new Map(cached);

  if (missing.length === 0) {
    return urlByPath;
  }

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(missing, SIGNED_URL_TTL_SEC);

  if (error) {
    console.error("[atlas:db] batch signed urls failed", error);
    return urlByPath;
  }

  const expiresAt = Date.now() + SIGNED_URL_TTL_SEC * 1000;
  for (const item of data ?? []) {
    if (item.error || !item.signedUrl || !item.path) continue;
    setCachedSignedUrl(item.path, item.signedUrl, expiresAt);
    urlByPath.set(item.path, item.signedUrl);
  }

  return urlByPath;
}

async function mapPhotoRows(rows: PhotoRow[]): Promise<Photo[]> {
  const urlByPath = await signPhotoPaths(rows.map((row) => row.path));
  return rows.map((row) => mapPhotoRow(row, urlByPath));
}

function mapJournals(row: MemoryRow): Record<PartnerId, JournalEntry> {
  const journals = emptyJournals();

  if (row.journal_panda !== undefined || row.journal_henne !== undefined) {
    journals.panda = {
      text: row.journal_panda ?? "",
      shared: row.journal_panda_shared ?? true,
    };
    journals.henne = {
      text: row.journal_henne ?? "",
      shared: row.journal_henne_shared ?? true,
    };
    return journals;
  }

  if (row.journal) {
    journals.panda = { text: row.journal, shared: true };
  }

  return journals;
}

function mapMemory(row: MemoryRow, photoIds: string[] = []): Memory {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    lat: row.lat,
    lng: row.lng,
    placeName: row.place_name,
    address: row.address ?? "",
    type: row.type,
    journals: mapJournals(row),
    photoIds,
    visibility: row.visibility ?? "shared",
    owner: row.owner ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function signedUrl(path: string): Promise<string> {
  const cached = getCachedSignedUrl(path);
  if (cached) return cached;

  const urlByPath = await signPhotoPaths([path]);
  return urlByPath.get(path) ?? "";
}

export async function getAllMemories(): Promise<Memory[]> {
  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from("memories_visible")
    .select("*")
    .order("date", { ascending: true });

  if (error) throw error;

  const memories = (rows ?? []) as MemoryRow[];
  if (memories.length === 0) return [];

  const { data: photoRows, error: photoError } = await supabase
    .from("photos")
    .select("id, memory_id");
  if (photoError) throw photoError;

  const idsByMemory = new Map<string, string[]>();
  for (const photo of (photoRows ?? []) as Array<{ id: string; memory_id: string }>) {
    const list = idsByMemory.get(photo.memory_id) ?? [];
    list.push(photo.id);
    idsByMemory.set(photo.memory_id, list);
  }

  return memories.map((row) => mapMemory(row, idsByMemory.get(row.id) ?? []));
}

export async function saveMemory(memory: Memory): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("memories").upsert({
    id: memory.id,
    title: memory.title,
    date: memory.date,
    lat: memory.lat,
    lng: memory.lng,
    place_name: memory.placeName,
    address: memory.address ?? "",
    type: memory.type,
    journal_panda: memory.journals.panda.text,
    journal_henne: memory.journals.henne.text,
    journal_panda_shared: memory.journals.panda.shared,
    journal_henne_shared: memory.journals.henne.shared,
    visibility: memory.visibility,
    owner: memory.owner,
    created_at: memory.createdAt,
    updated_at: memory.updatedAt,
    created_by: user?.id ?? null,
  });

  if (error) throw error;
}

export async function deleteMemories(ids: string[]): Promise<void> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return;

  const supabase = createClient();
  const { data, error: photoError } = await supabase
    .from("photos")
    .select("path")
    .in("memory_id", uniqueIds);
  if (photoError) throw photoError;

  const paths = [
    ...new Set((data ?? []).map((row) => row.path as string).filter(Boolean)),
  ];
  for (const path of paths) {
    invalidateSignedUrl(path);
    void invalidateCachedPhoto(path);
  }
  if (paths.length > 0) {
    await supabase.storage.from(PHOTO_BUCKET).remove(paths);
  }

  const { error } = await supabase.from("memories").delete().in("id", uniqueIds);
  if (error) throw error;
}

export async function deleteMemory(id: string): Promise<void> {
  await deleteMemories([id]);
}

export async function getPhotosForMemory(memoryId: string): Promise<Photo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("memory_id", memoryId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as PhotoRow[];
  return mapPhotoRows(rows);
}

export async function getAllPhotos(): Promise<Photo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as PhotoRow[];
  return mapPhotoRows(rows);
}

export async function updatePhotoHidden(id: string, hidden: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("photos").update({ hidden }).eq("id", id);
  if (error) throw error;
}

export async function savePhoto(input: {
  id: string;
  memoryId: string;
  file: File;
  hidden?: boolean;
}): Promise<Photo> {
  const validationError = validatePhotoFile(input.file);
  if (validationError) {
    throw new Error(validationError);
  }

  const supabase = createClient();
  const file = await preparePhotoFile(input.file);

  if (file.size > MAX_PHOTO_BYTES) {
    const mb = Math.round(MAX_PHOTO_BYTES / (1024 * 1024));
    throw new Error(`Photo must be under ${mb} MB after conversion.`);
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${input.memoryId}/${input.id}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || "image/jpeg",
      cacheControl: "31536000",
    });
  if (uploadError) throw uploadError;

  const { error: rowError } = await supabase.from("photos").insert({
    id: input.id,
    memory_id: input.memoryId,
    path,
    name: file.name,
    hidden: input.hidden ?? false,
  });
  if (rowError) throw rowError;

  return {
    id: input.id,
    memoryId: input.memoryId,
    name: file.name,
    path,
    url: await signedUrl(path),
    hidden: input.hidden ?? false,
    createdAt: new Date().toISOString(),
  };
}

export async function deletePhotos(ids: string[]): Promise<void> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return;

  const supabase = createClient();
  const { data, error } = await supabase.from("photos").select("path").in("id", uniqueIds);
  if (error) throw error;

  const paths = [
    ...new Set((data ?? []).map((row) => row.path as string).filter(Boolean)),
  ];
  for (const path of paths) {
    invalidateSignedUrl(path);
    void invalidateCachedPhoto(path);
  }
  if (paths.length > 0) {
    await supabase.storage.from(PHOTO_BUCKET).remove(paths);
  }

  const { error: deleteError } = await supabase.from("photos").delete().in("id", uniqueIds);
  if (deleteError) throw deleteError;
}

export async function deletePhoto(id: string): Promise<void> {
  await deletePhotos([id]);
}
