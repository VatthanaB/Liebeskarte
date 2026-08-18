"use client";

import { type ReactNode, useEffect } from "react";
import { themeToCssVars, THEME } from "@/lib/themes";
import { ErrorBoundary } from "./ErrorBoundary";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const style = themeToCssVars(THEME);
  console.log("[atlas:theme] ThemeProvider render", THEME.name);

  useEffect(() => {
    console.log("[atlas:theme] ThemeProvider mounted");

    const onError = (event: ErrorEvent) => {
      console.error("[atlas:window-error]", event.message, event.error);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      console.error("[atlas:unhandled-rejection]", event.reason);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <div
        style={style}
        className="h-full min-h-screen bg-[var(--theme-bg)] text-[var(--theme-ink)]"
      >
        {children}
      </div>
    </ErrorBoundary>
  );
}

export function useTheme() {
  return { theme: THEME };
}
