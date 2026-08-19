import type { PartnerId } from "./types";

/** Internal emails for Supabase password auth. Never shown in the UI. */
export const AUTH_EMAIL_DOMAIN = "liebeskarte.app";

export function isPartnerUsername(value: string): value is PartnerId {
  const normalized = value.trim().toLowerCase();
  return normalized === "panda" || normalized === "henne";
}

export function partnerFromUsername(value: string): PartnerId | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "panda" || normalized === "henne") return normalized;
  return null;
}

export function emailFromUsername(username: PartnerId): string {
  return `${username}@${AUTH_EMAIL_DOMAIN}`;
}

export function partnerFromEmail(email: string | undefined | null): PartnerId | null {
  if (!email) return null;
  const local = email.split("@")[0]?.trim().toLowerCase();
  if (local === "panda" || local === "henne") return local;
  return null;
}
