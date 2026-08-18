import { Suspense } from "react";
import { LoveLoading } from "@/components/LoveLoading";
import MapPageClient from "./MapPageClient";

export default function Page() {
  return (
    <Suspense fallback={<LoveLoading variant="page" />}>
      <MapPageClient />
    </Suspense>
  );
}
