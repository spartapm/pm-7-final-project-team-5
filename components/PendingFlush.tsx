"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { takePending } from "@/lib/pending";
import { useStore } from "@/lib/store";

export function PendingFlush() {
  const router = useRouter();
  const path = usePathname();
  const { hydrated, loggedIn, querying, addTrade, addPlan } = useStore();

  useEffect(() => {
    if (!hydrated || !loggedIn || querying) return;
    if (path.startsWith("/signup") || path.startsWith("/welcome") || path.startsWith("/legal")) return;
    const pending = takePending();
    if (!pending) return;
    if (pending.kind === "trade") {
      const saved = addTrade(pending.draft);
      if (saved) router.replace(`/records/${saved.id}`);
      return;
    }
    addPlan(pending.payload);
    router.replace("/plan");
  }, [hydrated, loggedIn, querying, path, addTrade, addPlan, router]);

  return null;
}
