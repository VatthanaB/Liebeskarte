"use client";

import { useCallback, useEffect, useState } from "react";
import { getAllMemories, getPhotosForMemory } from "@/lib/db";
import type { Memory } from "@/lib/types";
import { AUTH_ENABLED, useAuth } from "@/lib/auth";

export function useMemories() {
  const { user } = useAuth();
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
      setMemories(data);

      const urlMap: Record<string, string[]> = {};
      for (const memory of data) {
        const photos = await getPhotosForMemory(memory.id);
        urlMap[memory.id] = photos.map((photo) => photo.url).filter(Boolean);
      }
      setPhotoUrlMap(urlMap);
      console.log("[atlas:db] loadMemories done", data.length);
    } catch (error) {
      console.error("[atlas:db] loadMemories failed", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  return { memories, loading, photoUrlMap, reload: loadMemories };
}
