export const ONBOARDING_STORAGE_KEY = "liebeskarte-onboarding";
export const ONBOARDING_CHANGE_EVENT = "liebeskarte-onboarding-change";

function notifyOnboardingChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ONBOARDING_CHANGE_EVENT));
}

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_STORAGE_KEY) === "done";
}

export function markOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_STORAGE_KEY, "done");
  notifyOnboardingChange();
}

export function resetOnboarding(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  notifyOnboardingChange();
}

export function subscribeOnboarding(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(ONBOARDING_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(ONBOARDING_CHANGE_EVENT, onStoreChange);
  };
}
