"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { PartnerId } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { partnerFromEmail } from "@/lib/partner-auth";
import { createClient } from "@/lib/supabase";
import { LoveLoading } from "./LoveLoading";

interface PartnerSessionContextValue {
  partner: PartnerId | null;
  ready: boolean;
}

const PartnerSessionContext = createContext<PartnerSessionContextValue | null>(
  null
);

export function CurrentPartnerProvider({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [partner, setPartner] = useState<PartnerId | null>(null);
  const [ready, setReady] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPartner() {
      if (!user) {
        setPartner(null);
        setReady(true);
        return;
      }

      setReady(false);
      setProfileError(null);

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("partner")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) throw error;

        const fromProfile =
          data?.partner === "panda" || data?.partner === "henne"
            ? data.partner
            : null;
        const fromMeta = user.user_metadata?.partner;
        const metaPartner =
          fromMeta === "panda" || fromMeta === "henne" ? fromMeta : null;
        const next =
          fromProfile ?? metaPartner ?? partnerFromEmail(user.email);

        if (!next) {
          setPartner(null);
          setProfileError("This account is not linked to panda or henne.");
        } else {
          setPartner(next);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[atlas:auth] profile load failed", err);
        const fallback = partnerFromEmail(user.email);
        if (fallback) {
          setPartner(fallback);
        } else {
          setPartner(null);
          setProfileError("Couldn't load your profile. Try signing in again.");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void loadPartner();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!ready) {
    return <LoveLoading variant="page" />;
  }

  if (user && !partner) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
        <div
          className="w-full max-w-sm rounded-2xl border p-6 shadow-md"
          style={{
            backgroundColor: "var(--theme-surface)",
            borderColor: "var(--theme-border)",
          }}
        >
          <h1
            className="mb-2 text-2xl font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Account not linked
          </h1>
          <p className="mb-5 text-sm" style={{ color: "var(--theme-ink-muted)" }}>
            {profileError ?? "This login is not a couple member."}
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="min-h-11 w-full rounded-lg py-2.5 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--theme-accent)" }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <PartnerSessionContext.Provider value={{ partner, ready }}>
      {children}
    </PartnerSessionContext.Provider>
  );
}

function usePartnerSession() {
  const ctx = useContext(PartnerSessionContext);
  if (!ctx) {
    throw new Error(
      "usePartnerSession must be used within CurrentPartnerProvider"
    );
  }
  return ctx;
}

export function useCurrentPartner() {
  const { partner } = usePartnerSession();
  const { signOut } = useAuth();
  if (!partner) {
    throw new Error("useCurrentPartner requires an authenticated partner");
  }
  return { partner, signOut };
}
