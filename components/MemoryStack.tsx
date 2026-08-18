"use client";

import { useCallback, useEffect } from "react";
import type { Memory } from "@/lib/types";
import { MemoryCard } from "./MemoryCard";

interface MemoryStackProps {
  memories: Memory[];
  selectedId: string;
  photoUrlMap: Record<string, string[]>;
  onSelect: (memory: Memory) => void;
  onClose: () => void;
  onEdit: () => void;
}

export function MemoryStack({
  memories,
  selectedId,
  photoUrlMap,
  onSelect,
  onClose,
  onEdit,
}: MemoryStackProps) {
  const index = Math.max(
    0,
    memories.findIndex((memory) => memory.id === selectedId)
  );
  const current = memories[index] ?? memories[0];

  const goTo = useCallback(
    (nextIndex: number) => {
      const next = memories[nextIndex];
      if (!next) return;
      onSelect(next);
    },
    [memories, onSelect]
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goTo, index]);

  if (!current) return null;

  return (
    <MemoryCard
      memory={current}
      photoUrls={photoUrlMap[current.id] ?? []}
      onClose={onClose}
      onEdit={onEdit}
      stack={{
        index,
        total: memories.length,
        items: memories,
        onPrev: () => goTo(index - 1),
        onNext: () => goTo(index + 1),
        onGoTo: goTo,
      }}
    />
  );
}
