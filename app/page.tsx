import { Suspense } from "react";
import MapPageClient from "./MapPageClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <p style={{ color: "var(--theme-ink-muted)" }}>Loading Liebeskarte...</p>
        </div>
      }
    >
      <MapPageClient />
    </Suspense>
  );
}
