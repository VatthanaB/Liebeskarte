import { createClient } from "./supabase";
import { preparePhotoFile } from "./photo-file";
import type { Memory, MilestoneType, Photo } from "./types";
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
  journal: string;
  created_at: string;
  updated_at: string;
}

interface PhotoRow {
  id: string;
  memory_id: string;
  path: string;
  name: string;
  created_at: string;
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
    journal: row.journal,
    photoIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function signedUrl(path: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24);
  if (error || !data?.signedUrl) {
    console.error("[atlas:db] signed url failed", error);
    return "";
  }
  return data.signedUrl;
}

export async function getAllMemories(): Promise<Memory[]> {
  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from("memories")
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
    journal: memory.journal,
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
  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      memoryId: row.memory_id,
      name: row.name,
      path: row.path,
      url: await signedUrl(row.path),
      createdAt: row.created_at,
    }))
  );
}

export async function savePhoto(input: {
  id: string;
  memoryId: string;
  file: File;
}): Promise<Photo> {
  const supabase = createClient();
  const file = await preparePhotoFile(input.file);
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
  });
  if (rowError) throw rowError;

  return {
    id: input.id,
    memoryId: input.memoryId,
    name: file.name,
    path,
    url: await signedUrl(path),
    createdAt: new Date().toISOString(),
  };
}

export async function deletePhoto(id: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from("photos").select("path").eq("id", id).maybeSingle();
  if (error) throw error;
  if (data?.path) {
    await supabase.storage.from(PHOTO_BUCKET).remove([data.path as string]);
  }
  const { error: deleteError } = await supabase.from("photos").delete().eq("id", id);
  if (deleteError) throw deleteError;
}
