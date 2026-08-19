"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient, hasSupabaseConfig } from "@/lib/supabase";
import {
  emailFromUsername,
  partnerFromUsername,
} from "@/lib/partner-auth";

/** Login is the auth boundary. Keep true in production. */
export const AUTH_ENABLED = true;

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = hasSupabaseConfig();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;

    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      configured,
      async signIn(username, password) {
        const partner = partnerFromUsername(username);
        if (!partner) {
          throw new Error("Use panda or henne as your username.");
        }
        const { error } = await createClient().auth.signInWithPassword({
          email: emailFromUsername(partner),
          password,
        });
        if (error) throw error;
      },
      async signOut() {
        const { error } = await createClient().auth.signOut();
        if (error) throw error;
      },
    }),
    [user, session, loading, configured]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
