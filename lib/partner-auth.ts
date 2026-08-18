import type { PartnerId } from "./types";

const PASSWORDS: Record<string, PartnerId> = {
  panda: "panda",
  henne: "henne",
};

export function partnerFromPassword(password: string): PartnerId | null {
  return PASSWORDS[password.trim().toLowerCase()] ?? null;
}
