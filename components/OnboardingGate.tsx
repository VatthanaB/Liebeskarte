"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  isOnboardingComplete,
  subscribeOnboarding,
} from "@/lib/onboarding";
import { LoveLoading } from "./LoveLoading";

export function OnboardingGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const complete = useSyncExternalStore(
    subscribeOnboarding,
    isOnboardingComplete,
    () => true
  );
  const onOnboarding = pathname === "/onboarding";
  const shouldRedirect = !complete && !onOnboarding;

  useEffect(() => {
    if (!shouldRedirect) return;
    router.replace("/onboarding");
  }, [shouldRedirect, router]);

  if (shouldRedirect) {
    return <LoveLoading variant="page" />;
  }

  return children;
}
