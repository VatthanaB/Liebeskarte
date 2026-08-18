"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { partnerFromPassword } from "@/lib/partner-auth";
import type { PartnerId } from "@/lib/types";
import { PartnerGate } from "./PartnerGate";
import { LoveLoading } from "./LoveLoading";

const STORAGE_KEY = "liebeskarte-partner";

interface PartnerSessionContextValue {
  partner: PartnerId | null;
  ready: boolean;
  signIn: (password: string) => boolean;
  signOut: () => void;
}

const PartnerSessionContext = createContext<PartnerSessionContextValue | null>(
  null
);

export function CurrentPartnerProvider({ children }: { children: ReactNode }) {
  const [partner, setPartner] = useState<PartnerId | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "panda" || stored === "henne") {
      setPartner(stored);
    }
    setReady(true);
  }, []);

  function signIn(password: string) {
    const match = partnerFromPassword(password);
    if (!match) return false;
    setPartner(match);
    localStorage.setItem(STORAGE_KEY, match);
    return true;
  }

  function signOut() {
    setPartner(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <PartnerSessionContext.Provider value={{ partner, ready, signIn, signOut }}>
      {!ready ? (
        <LoveLoading variant="page" />
      ) : partner ? (
        children
      ) : (
        <PartnerGate />
      )}
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
  const { partner, signOut } = usePartnerSession();
  if (!partner) {
    throw new Error("useCurrentPartner requires an authenticated partner");
  }
  return { partner, signOut };
}

export function usePartnerGate() {
  const { signIn } = usePartnerSession();
  return { signIn };
}
