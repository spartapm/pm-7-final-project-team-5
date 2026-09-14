"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setAnalyticsUserId, trackPageView } from "@/lib/analytics";
import { useStore } from "@/lib/store";

export function Analytics() {
  const pathname = usePathname();
  const { hydrated, loggedIn, accountId } = useStore();

  useEffect(() => {
    if (!hydrated) return;
    setAnalyticsUserId(loggedIn ? accountId : null);
  }, [hydrated, loggedIn, accountId]);

  useEffect(() => {
    if (!pathname) return;
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
