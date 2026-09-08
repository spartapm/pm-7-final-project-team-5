"use client";

import { StoreProvider } from "@/lib/store";
import { VisitGate } from "@/components/VisitGate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <VisitGate>{children}</VisitGate>
    </StoreProvider>
  );
}
