"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { peekPending, takePending } from "@/lib/pending";
import { useStore } from "@/lib/store";

export function PendingFlush() {
  const router = useRouter();
  const path = usePathname();
  const { hydrated, loggedIn, querying, addTrade, addPlan } = useStore();
  const tried = useRef(false);

  useEffect(() => {
    if (!hydrated || !loggedIn || querying) return;
    if (path.startsWith("/signup") || path.startsWith("/welcome") || path.startsWith("/legal")) return;
    if (tried.current) return;
    const pending = peekPending();
    if (!pending) return;
    tried.current = true;
    if (pending.kind === "trade") {
      const saved = addTrade(pending.draft);
      if (saved) {
        takePending();
        router.replace(`/records/${saved.id}`);
      }
      return;
    }
    const saved = addPlan(pending.payload);
    takePending();
    router.replace(`/plan/${saved.id}`);
  }, [hydrated, loggedIn, querying, path, addTrade, addPlan, router]);

  return null;
}
