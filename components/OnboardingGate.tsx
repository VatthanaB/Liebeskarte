"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  isOnboardingComplete,
  subscribeOnboarding,
} from "@/lib/onboarding";
import { useCurrentPartner } from "@/components/CurrentPartnerProvider";
import { LoveLoading } from "./LoveLoading";

export function OnboardingGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { partner } = useCurrentPartner();
  const complete = useSyncExternalStore(
    subscribeOnboarding,
    isOnboardingComplete,
    () => true
  );
  const onOnboarding = pathname === "/onboarding";
  const shouldRedirectToLetter = partner === "henne" && !complete && !onOnboarding;
  const shouldRedirectPandaAway = partner === "panda" && onOnboarding;

  useEffect(() => {
    if (shouldRedirectToLetter) {
      router.replace("/onboarding");
      return;
    }
    if (shouldRedirectPandaAway) {
      router.replace("/");
    }
  }, [shouldRedirectToLetter, shouldRedirectPandaAway, router]);

  if (shouldRedirectToLetter || shouldRedirectPandaAway) {
    return <LoveLoading variant="page" />;
  }

  return children;
}
