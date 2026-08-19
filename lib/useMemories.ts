"use client";

import { useCallback, useEffect, useState } from "react";
import { getAllMemories, getAllPhotos } from "@/lib/db";
import type { Memory, Photo } from "@/lib/types";
import { AUTH_ENABLED, useAuth } from "@/lib/auth";
import { useShowHiddenPhotos } from "@/components/ShowHiddenPhotosProvider";
import { useCurrentPartner } from "@/components/CurrentPartnerProvider";
import { visibleToPartner } from "@/lib/memory-visibility";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";

const REALTIME_RELOAD_MS = 400;

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
    urlMap[memory.id] = memoryPhotos
      .filter((photo) => showHiddenPhotos || !photo.hidden)
      .map((photo) => photo.url)
      .filter(Boolean);
  }
  return urlMap;
}

export function useMemories() {
  const { user } = useAuth();
  const { partner } = useCurrentPartner();
  const { showHiddenPhotos } = useShowHiddenPhotos();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoUrlMap, setPhotoUrlMap] = useState<Record<string, string[]>>({});

  const loadMemories = useCallback(async (options?: { silent?: boolean }) => {
    if (AUTH_ENABLED && !user) {
      setMemories([]);
      setPhotoUrlMap({});
      setError(null);
      setLoading(false);
      return;
    }

    const silent = options?.silent === true;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [data, allPhotos] = await Promise.all([getAllMemories(), getAllPhotos()]);
      const visible = data.filter((memory) => visibleToPartner(memory, partner));
      setMemories(visible);
      setPhotoUrlMap(buildPhotoUrlMap(visible, allPhotos, showHiddenPhotos));
      setError(null);
    } catch (err) {
      console.error("[atlas:db] loadMemories failed", err);
      if (!silent) {
        setError(loadErrorMessage(err));
      }
    } finally {
      if (!silent) setLoading(false);
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
