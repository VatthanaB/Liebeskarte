"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAllMemories, getAllPhotos } from "@/lib/db";
import { withCoverFirst } from "@/lib/photos";
import type { Memory, Photo } from "@/lib/types";
import { AUTH_ENABLED, useAuth } from "@/lib/auth";
import { useShowHiddenPhotos } from "@/components/ShowHiddenPhotosProvider";
import { useCurrentPartner } from "@/components/CurrentPartnerProvider";
import { visibleToPartner } from "@/lib/memory-visibility";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";

const REALTIME_RELOAD_MS = 400;

interface MemoriesSnapshot {
  memories: Memory[];
  photos: Photo[];
  photoUrlMap: Record<string, string[]>;
}

let lastSnapshot: MemoriesSnapshot | null = null;

function loadErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Couldn't load memories. Check your connection and try again.";
}

function buildPhotoUrlMap(
  visible: Memory[],
  photos: Photo[],
  showHiddenPhotos: boolean
): Record<string, string[]> {
  const photosByMemory = new Map<string, Photo[]>();
  for (const photo of photos) {
    const list = photosByMemory.get(photo.memoryId) ?? [];
    list.push(photo);
    photosByMemory.set(photo.memoryId, list);
  }

  const urlMap: Record<string, string[]> = {};
  for (const memory of visible) {
    const memoryPhotos = photosByMemory.get(memory.id) ?? [];
    urlMap[memory.id] = withCoverFirst(
      memoryPhotos,
      memory.coverPhotoId,
      (photo) => photo.id,
    )
      .filter((photo) => showHiddenPhotos || !photo.hidden)
      .map((photo) => photo.url)
      .filter(Boolean);
  }
  return urlMap;
}

export type LoadMemoriesOptions = {
  /** When omitted, reloads after the first fetch are silent (no loading UI). */
  silent?: boolean;
};

export function useMemories() {
  const { user } = useAuth();
  const { partner } = useCurrentPartner();
  const { showHiddenPhotos } = useShowHiddenPhotos();
  const [memories, setMemories] = useState<Memory[]>(() => lastSnapshot?.memories ?? []);
  const [loading, setLoading] = useState(() => lastSnapshot === null);
  const [error, setError] = useState<string | null>(null);
  const [photoUrlMap, setPhotoUrlMap] = useState<Record<string, string[]>>(
    () => lastSnapshot?.photoUrlMap ?? {},
  );
  const loadGenerationRef = useRef(0);
  const hasLoadedRef = useRef(lastSnapshot !== null);

  const loadMemories = useCallback(async (options?: LoadMemoriesOptions) => {
    if (AUTH_ENABLED && !user) {
      setMemories([]);
      setPhotoUrlMap({});
      setError(null);
      setLoading(false);
      hasLoadedRef.current = true;
      lastSnapshot = null;
      return;
    }

    const generation = ++loadGenerationRef.current;
    const silent = options?.silent ?? hasLoadedRef.current;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [data, allPhotos] = await Promise.all([getAllMemories(), getAllPhotos()]);
      if (generation !== loadGenerationRef.current) return;

      const visible = data.filter((memory) => visibleToPartner(memory, partner));
      const nextPhotoUrlMap = buildPhotoUrlMap(visible, allPhotos, showHiddenPhotos);
      setMemories(visible);
      setPhotoUrlMap(nextPhotoUrlMap);
      setError(null);
      lastSnapshot = {
        memories: visible,
        photos: allPhotos,
        photoUrlMap: nextPhotoUrlMap,
      };
    } catch (err) {
      if (generation !== loadGenerationRef.current) return;
      console.error("[atlas:db] loadMemories failed", err);
      if (!silent) {
        setError(loadErrorMessage(err));
      }
    } finally {
      if (generation === loadGenerationRef.current) {
        hasLoadedRef.current = true;
        if (!silent) setLoading(false);
      }
    }
  }, [user, showHiddenPhotos, partner]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) void loadMemories();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loadMemories]);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    if (AUTH_ENABLED && !user) return;

    let timeout: number | null = null;
    const scheduleReload = () => {
      if (timeout != null) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        void loadMemories({ silent: true });
      }, REALTIME_RELOAD_MS);
    };

    const supabase = createClient();
    const channel = supabase
      .channel("couple-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sync_events" },
        scheduleReload
      )
      .subscribe();

    return () => {
      if (timeout != null) window.clearTimeout(timeout);
      void supabase.removeChannel(channel);
    };
  }, [user, loadMemories]);

  return { memories, loading, error, photoUrlMap, reload: loadMemories };
}
