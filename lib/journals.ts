import type { JournalEntry, Memory, PartnerId } from "./types";

export function emptyJournals(): Record<PartnerId, JournalEntry> {
  return {
    panda: { text: "", shared: false },
    henne: { text: "", shared: false },
  };
}

export function otherPartnerId(partner: PartnerId): PartnerId {
  return partner === "panda" ? "henne" : "panda";
}

export function visibleJournals(
  memory: Memory,
  currentPartner: PartnerId
): Array<{ partnerId: PartnerId; entry: JournalEntry }> {
  const result: Array<{ partnerId: PartnerId; entry: JournalEntry }> = [];
  const myEntry = memory.journals[currentPartner];
  if (myEntry.text.trim()) {
    result.push({ partnerId: currentPartner, entry: myEntry });
  }

  const other = otherPartnerId(currentPartner);
  const otherEntry = memory.journals[other];
  if (otherEntry.shared && otherEntry.text.trim()) {
    result.push({ partnerId: other, entry: otherEntry });
  }

  return result;
}

export function pandaSharedJournal(text: string): Record<PartnerId, JournalEntry> {
  return {
    panda: { text, shared: true },
    henne: { text: "", shared: false },
  };
}
