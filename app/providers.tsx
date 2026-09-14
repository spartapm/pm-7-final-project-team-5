"use client";

import { StoreProvider } from "@/lib/store";
import { Analytics } from "@/components/Analytics";
import { VisitGate } from "@/components/VisitGate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Analytics />
      <VisitGate>{children}</VisitGate>
    </StoreProvider>
  );
}
