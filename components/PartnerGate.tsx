"use client";

import { useState } from "react";
import { usePartnerGate } from "./CurrentPartnerProvider";

export function PartnerGate() {
  const { signIn } = usePartnerGate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (signIn(password)) return;
    setError("Wrong password — try again.");
    setPassword("");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border p-6 shadow-md"
        style={{
          backgroundColor: "var(--theme-surface)",
          borderColor: "var(--theme-border)",
        }}
      >
        <p
          className="mb-1 text-xs uppercase tracking-widest"
          style={{ color: "var(--theme-ink-muted)", fontFamily: "var(--font-label)" }}
        >
          Liebeskarte
        </p>
        <h1
          className="mb-2 text-2xl font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Who&apos;s here?
        </h1>
        <p className="mb-5 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
          Enter your password to open your journal. We&apos;ll remember you on this
          device.
        </p>

        <label className="mb-4 block text-sm">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full min-h-11 rounded-lg border px-3 py-2"
            style={{
              borderColor: "var(--theme-border)",
              backgroundColor: "var(--theme-bg)",
            }}
            placeholder="Your password"
          />
        </label>

        {error && (
          <p className="mb-3 text-sm" style={{ color: "#C4704B" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className="min-h-11 w-full rounded-lg py-2.5 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--theme-accent)" }}
        >
          Open
        </button>
      </form>
    </div>
  );
}
