"use client";

import type { PartnerId } from "@/lib/types";
import { PARTNERS } from "@/lib/types";
import { useCurrentPartner } from "./CurrentPartnerProvider";
import { useConfirm } from "./ConfirmDialog";

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
  const confirm = useConfirm();
  const name = PARTNERS[partner].label;

  async function handleSwitch() {
    const confirmed = await confirm({
      title: `Sign out of ${name}?`,
      description: "The other person can then sign in as panda or henne on this device.",
      confirmLabel: "Sign out",
    });
    if (confirmed) void signOut();
  }

  return (
    <section
      className="mb-10 rounded-xl border p-4 md:p-5"
      style={{
        borderColor: "var(--theme-border)",
        backgroundColor: "var(--theme-surface)",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2
            className="flex items-center gap-2 text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span style={{ color: "var(--theme-ink-muted)" }}>
              <PartnerIcon partner={partner} />
            </span>
            Signed in as {name}
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
            Sign out to let the other person open the journal on this device.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSwitch}
          className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-medium self-start sm:self-center"
          style={{
            borderColor: "var(--theme-border)",
            color: "var(--theme-ink)",
            fontFamily: "var(--font-label)",
          }}
        >
          Sign out
        </button>
      </div>
    </section>
  );
}
