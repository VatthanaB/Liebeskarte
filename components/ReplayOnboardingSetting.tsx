"use client";

import { useRouter } from "next/navigation";
import { resetOnboarding } from "@/lib/onboarding";

export function ReplayOnboardingSetting() {
  const router = useRouter();

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
            Welcome guide
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
            Replay the first-run walkthrough, including where we met.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReplay}
          className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-medium self-start sm:self-center"
          style={{
            borderColor: "var(--theme-border)",
            color: "var(--theme-ink)",
            fontFamily: "var(--font-label)",
          }}
        >
          Replay guide
        </button>
      </div>
    </section>
  );
}
