"use client";

import { StoreProvider } from "@/lib/store";
import { Analytics } from "@/components/Analytics";
import { PendingFlush } from "@/components/PendingFlush";
import { VisitGate } from "@/components/VisitGate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Analytics />
      <VisitGate>
        <PendingFlush />
        {children}
      </VisitGate>
    </StoreProvider>
  );
}
