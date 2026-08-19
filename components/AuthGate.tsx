"use client";

import { useState } from "react";
import { AUTH_ENABLED, useAuth } from "@/lib/auth";
import { PARTNER_IDS, PARTNERS, type PartnerId } from "@/lib/types";
import { LoveLoading } from "@/components/LoveLoading";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, configured, signIn } = useAuth();
  const [username, setUsername] = useState<PartnerId | "">("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
        <div
          className="w-full max-w-md rounded-2xl border p-6 shadow-md"
          style={{
            backgroundColor: "var(--theme-surface)",
            borderColor: "var(--theme-border)",
          }}
        >
          <h1
            className="mb-2 text-2xl font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Connect Supabase
          </h1>
          <p className="mb-4 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
            Memories and photos live in the cloud. Add your project keys to{" "}
            <code>web/.env.local</code> (see <code>env.example</code> and{" "}
            <code>docs/hosting.md</code>), then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  if (!AUTH_ENABLED) {
    return <>{children}</>;
  }

  if (loading) {
    return <LoveLoading variant="page" />;
  }

  if (!user) {
    async function handleSubmit(event: React.FormEvent) {
      event.preventDefault();
      setError(null);
      setBusy(true);
      try {
        await signIn(username, password);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not sign in");
      } finally {
        setBusy(false);
      }
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
            Pick panda or henne, then enter your password. We&apos;ll remember you on this device.
          </p>

          <label className="mb-3 block text-sm">
            Username
            <select
              name="username"
              autoComplete="username"
              required
              value={username}
              onChange={(event) =>
                setUsername(event.target.value as PartnerId | "")
              }
              className="mt-1 w-full min-h-11 rounded-lg border px-3 py-2"
              style={{
                borderColor: "var(--theme-border)",
                backgroundColor: "var(--theme-bg)",
                color: "var(--theme-ink)",
              }}
            >
              <option value="" disabled>
                Choose who you are
              </option>
              {PARTNER_IDS.map((id) => (
                <option key={id} value={id}>
                  {PARTNERS[id].label}
                </option>
              ))}
            </select>
          </label>
          <label className="mb-4 block text-sm">
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              minLength={6}
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
            disabled={busy}
            className="min-h-11 w-full rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--theme-accent)" }}
          >
            {busy ? "..." : "Open"}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
