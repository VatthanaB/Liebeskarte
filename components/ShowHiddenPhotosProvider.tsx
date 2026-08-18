"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getStoredShowHiddenPhotos,
  getStoredShowHiddenPhotosExpiresAt,
  getShowHiddenPhotosRemainingMs,
  setStoredShowHiddenPhotos,
} from "@/lib/show-hidden-photos";

interface ShowHiddenPhotosContextValue {
  showHiddenPhotos: boolean;
  expiresAt: number | null;
  setShowHiddenPhotos: (value: boolean) => void;
}

const ShowHiddenPhotosContext =
  createContext<ShowHiddenPhotosContextValue | null>(null);

function readActiveState(): { enabled: boolean; expiresAt: number | null } {
  const expiresAt = getStoredShowHiddenPhotosExpiresAt();
  return {
    enabled: expiresAt !== null,
    expiresAt,
  };
}

export function ShowHiddenPhotosProvider({ children }: { children: ReactNode }) {
  const [showHiddenPhotos, setShowHiddenPhotosState] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const syncFromStorage = useCallback(() => {
    const next = readActiveState();
    setShowHiddenPhotosState(next.enabled);
    setExpiresAt(next.expiresAt);
    return next;
  }, []);

  useEffect(() => {
    syncFromStorage();
    setHydrated(true);
  }, [syncFromStorage]);

  const setShowHiddenPhotos = useCallback((value: boolean) => {
    setStoredShowHiddenPhotos(value);
    const next = readActiveState();
    setShowHiddenPhotosState(next.enabled);
    setExpiresAt(next.expiresAt);
  }, []);

  useEffect(() => {
    if (!showHiddenPhotos) return;

    const remaining = getShowHiddenPhotosRemainingMs();
    if (remaining <= 0) {
      setShowHiddenPhotos(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowHiddenPhotos(false);
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [showHiddenPhotos, expiresAt, setShowHiddenPhotos]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      syncFromStorage();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [syncFromStorage]);

  const value = useMemo(
    () => ({
      showHiddenPhotos: hydrated ? showHiddenPhotos : false,
      expiresAt: hydrated ? expiresAt : null,
      setShowHiddenPhotos,
    }),
    [hydrated, showHiddenPhotos, expiresAt, setShowHiddenPhotos],
  );

  return (
    <ShowHiddenPhotosContext.Provider value={value}>
      {children}
    </ShowHiddenPhotosContext.Provider>
  );
}

export function useShowHiddenPhotos() {
  const context = useContext(ShowHiddenPhotosContext);
  if (!context) {
    throw new Error("useShowHiddenPhotos must be used within ShowHiddenPhotosProvider");
  }
  return context;
}
