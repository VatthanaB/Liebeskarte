"use client";

import { useCallback, useEffect, useState } from "react";
import { getAllMemories, getPhotosForMemory } from "@/lib/db";
import type { Memory } from "@/lib/types";
import { AUTH_ENABLED, useAuth } from "@/lib/auth";
import { useShowHiddenPhotos } from "@/components/ShowHiddenPhotosProvider";
import { useCurrentPartner } from "@/components/CurrentPartnerProvider";
import { visibleToPartner } from "@/lib/memory-visibility";

export function useMemories() {
  const { user } = useAuth();
  const { partner } = useCurrentPartner();
  const { showHiddenPhotos } = useShowHiddenPhotos();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoUrlMap, setPhotoUrlMap] = useState<Record<string, string[]>>({});

  const loadMemories = useCallback(async () => {
    if (AUTH_ENABLED && !user) {
      setMemories([]);
      setPhotoUrlMap({});
      setLoading(false);
      return;
    }

    console.log("[atlas:db] loadMemories start");
    setLoading(true);
    try {
      const data = await getAllMemories();
      const visible = data.filter((memory) => visibleToPartner(memory, partner));
      setMemories(visible);

      const urlMap: Record<string, string[]> = {};
      for (const memory of visible) {
        const photos = await getPhotosForMemory(memory.id);
        urlMap[memory.id] = photos
          .filter((photo) => showHiddenPhotos || !photo.hidden)
          .map((photo) => photo.url)
          .filter(Boolean);
      }
      setPhotoUrlMap(urlMap);
      console.log("[atlas:db] loadMemories done", visible.length);
    } catch (error) {
      console.error("[atlas:db] loadMemories failed", error);
    } finally {
      setLoading(false);
    }
  }, [user, showHiddenPhotos, partner]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  return { memories, loading, photoUrlMap, reload: loadMemories };
}
