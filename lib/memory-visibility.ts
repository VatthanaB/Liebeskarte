import type { Memory, PartnerId } from "./types";

export function isSharedMemory(memory: Memory): boolean {
  return memory.visibility === "shared";
}

export function isPersonalMemory(memory: Memory): boolean {
  return memory.visibility === "personal";
}

export function visibleToPartner(memory: Memory, partner: PartnerId): boolean {
  if (memory.visibility === "shared") return true;
  return memory.owner === partner;
}

export function sharedMemories(memories: Memory[]): Memory[] {
  return memories.filter(isSharedMemory);
}

export function personalMemoriesFor(
  memories: Memory[],
  partner: PartnerId
): Memory[] {
  return memories.filter(
    (memory) => memory.visibility === "personal" && memory.owner === partner
  );
}

export function canManageMemory(memory: Memory, partner: PartnerId): boolean {
  if (memory.visibility === "shared") return true;
  return memory.owner === partner;
}

export function filterVisibleMemories(
  memories: Memory[],
  partner: PartnerId
): Memory[] {
  return memories.filter((memory) => visibleToPartner(memory, partner));
}

export function filterManageableMemories(
  memories: Memory[],
  partner: PartnerId
): Memory[] {
  return memories.filter((memory) => canManageMemory(memory, partner));
}

export function canChangeMemoryVisibility(
  memory: Memory,
  partner: PartnerId
): boolean {
  return memory.owner === partner;
}
