import { createClient } from "./supabase";
import { emptyJournals } from "./journals";
import { preparePhotoFile } from "./photo-file";
import { validatePhotoFile, MAX_PHOTO_BYTES } from "./photo-limits";
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

async function mapPhotoRow(row: PhotoRow): Promise<Photo> {
  return {
    id: row.id,
    memoryId: row.memory_id,
    name: row.name,
    path: row.path,
    url: await signedUrl(row.path),
    hidden: row.hidden ?? false,
    createdAt: row.created_at,
  };
}

function mapJournals(row: MemoryRow): Record<PartnerId, JournalEntry> {
  const journals = emptyJournals();

  if (row.journal_panda !== undefined || row.journal_henne !== undefined) {
    journals.panda = {
      text: row.journal_panda ?? "",
      shared: row.journal_panda_shared ?? false,
    };
    journals.henne = {
      text: row.journal_henne ?? "",
      shared: row.journal_henne_shared ?? false,
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

const SIGNED_URL_TTL_SEC = 60 * 60 * 24;
/** Refresh cached URLs one hour before expiry. */
const SIGNED_URL_REFRESH_BUFFER_MS = 60 * 60 * 1000;

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export function invalidateSignedUrl(path: string): void {
  signedUrlCache.delete(path);
}

async function signedUrl(path: string): Promise<string> {
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now() + SIGNED_URL_REFRESH_BUFFER_MS) {
    return cached.url;
  }

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SEC);
  if (error || !data?.signedUrl) {
    console.error("[atlas:db] signed url failed", error);
    return "";
  }

  signedUrlCache.set(path, {
    url: data.signedUrl,
    expiresAt: Date.now() + SIGNED_URL_TTL_SEC * 1000,
  });
  return data.signedUrl;
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

export async function deleteMemory(id: string): Promise<void> {
  const supabase = createClient();
  const photos = await getPhotosForMemory(id);
  if (photos.length > 0) {
    for (const photo of photos) {
      invalidateSignedUrl(photo.path);
    }
    await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((photo) => photo.path));
  }
  const { error } = await supabase.from("memories").delete().eq("id", id);
  if (error) throw error;
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
  return Promise.all(rows.map(mapPhotoRow));
}

export async function getAllPhotos(): Promise<Photo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as PhotoRow[];
  return Promise.all(rows.map(mapPhotoRow));
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

export async function deletePhoto(id: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from("photos").select("path").eq("id", id).maybeSingle();
  if (error) throw error;
  if (data?.path) {
    invalidateSignedUrl(data.path as string);
    await supabase.storage.from(PHOTO_BUCKET).remove([data.path as string]);
  }
  const { error: deleteError } = await supabase.from("photos").delete().eq("id", id);
  if (deleteError) throw deleteError;
}
