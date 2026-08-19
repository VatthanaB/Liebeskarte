"use client";

import { useRouter } from "next/navigation";
import { resetOnboarding } from "@/lib/onboarding";
import { useCurrentPartner } from "@/components/CurrentPartnerProvider";

export function ReplayOnboardingSetting() {
  const router = useRouter();
  const { partner } = useCurrentPartner();

  if (partner !== "henne") {
    return null;
  }

  function handleReplay() {
    resetOnboarding();
    router.push("/onboarding");
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
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Your birthday letter
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
            Read your letter again — the one I wrote for you on your birthday.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReplay}
          className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center self-start rounded-full border px-4 text-sm font-medium sm:self-center"
          style={{
            borderColor: "var(--theme-border)",
            color: "var(--theme-ink)",
            fontFamily: "var(--font-label)",
          }}
        >
          Read again
        </button>
      </div>
    </section>
  );
}
