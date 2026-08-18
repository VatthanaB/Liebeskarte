"use client";

import { useState } from "react";
import { AUTH_ENABLED, useAuth } from "@/lib/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, configured, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!AUTH_ENABLED) {
    if (!configured) {
      return (
        <div className="flex min-h-screen items-center justify-center px-6">
          <div
            className="max-w-md rounded-2xl border p-6 shadow-md"
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
    return <>{children}</>;
  }

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div
          className="max-w-md rounded-2xl border p-6 shadow-md"
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
            Memories and photos now live in the cloud. Add your project keys to{" "}
            <code>web/.env.local</code> (see <code>env.example</code> and{" "}
            <code>docs/hosting.md</code>), then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p style={{ color: "var(--theme-ink-muted)" }}>Opening Liebeskarte...</p>
      </div>
    );
  }

  if (!user) {
    async function handleSubmit(event: React.FormEvent) {
      event.preventDefault();
      setError(null);
      setNotice(null);
      setBusy(true);
      try {
        if (mode === "in") {
          await signIn(email.trim(), password);
        } else {
          await signUp(email.trim(), password);
          setNotice("Account created. If email confirmation is on, check your inbox, then sign in.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not sign in");
      } finally {
        setBusy(false);
      }
    }

    return (
      <div className="flex min-h-screen items-center justify-center px-6">
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
            {mode === "in" ? "Welcome back" : "Create your key"}
          </h1>
          <p className="mb-5 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
            Shared cloud journal — only your allowlisted emails can open it.
          </p>

          <label className="mb-3 block text-sm">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              style={{
                borderColor: "var(--theme-border)",
                backgroundColor: "var(--theme-bg)",
              }}
            />
          </label>
          <label className="mb-4 block text-sm">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              style={{
                borderColor: "var(--theme-border)",
                backgroundColor: "var(--theme-bg)",
              }}
            />
          </label>

          {error && (
            <p className="mb-3 text-sm" style={{ color: "#C4704B" }}>
              {error}
            </p>
          )}
          {notice && (
            <p className="mb-3 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--theme-accent)" }}
          >
            {busy ? "..." : mode === "in" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
            className="mt-3 w-full text-sm underline"
            style={{ color: "var(--theme-ink-muted)" }}
          >
            {mode === "in" ? "Need an account?" : "Already have an account?"}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
