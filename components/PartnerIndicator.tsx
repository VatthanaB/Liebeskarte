"use client";

import type { PartnerId } from "@/lib/types";
import { PARTNERS } from "@/lib/types";
import { useCurrentPartner } from "./CurrentPartnerProvider";

function PartnerIcon({ partner }: { partner: PartnerId }) {
  if (partner === "panda") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="5.5" r="3.25" />
        <path d="M6.5 21v-2.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5V21" />
      </svg>
    );
  }

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
    >
      <circle cx="12" cy="5.5" r="3.25" />
      <path d="M8.5 21 10 11.5c0-1.1.9-2 2-2s2 .9 2 2L15.5 21" />
    </svg>
  );
}

export function PartnerIndicator() {
  const { partner, signOut } = useCurrentPartner();

  function handleClick() {
    const name = PARTNERS[partner].label;
    if (
      window.confirm(
        `Switch from ${name}? You'll need to enter your password again.`
      )
    ) {
      signOut();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-opacity active:opacity-50"
      style={{
        color: "var(--theme-ink-muted)",
      }}
      aria-label={`Signed in as ${PARTNERS[partner].label}. Tap to switch user.`}
      title={`Signed in as ${PARTNERS[partner].label}`}
    >
      <PartnerIcon partner={partner} />
    </button>
  );
}
