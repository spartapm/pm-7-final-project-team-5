"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { rememberNext } from "@/lib/next-path";
import { hasRevisitCookie, touchRevisitCookie } from "@/lib/visit";
import { useStore } from "@/lib/store";

const OPEN = ["/", "/onboarding", "/login", "/signup", "/legal", "/auth", "/welcome"];

export function VisitGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { hydrated, loggedIn } = useStore();

  useEffect(() => {
    if (!hydrated) return;
    if (loggedIn) {
      touchRevisitCookie();
      return;
    }
    const open = OPEN.some((p) => path === p || path.startsWith(p + "/"));
    if (open) {
      if (hasRevisitCookie()) touchRevisitCookie();
      return;
    }
    const full = path + (typeof window !== "undefined" ? window.location.search : "");
    if (!hasRevisitCookie()) {
      rememberNext(full);
      touchRevisitCookie();
      router.replace("/onboarding");
      return;
    }
    touchRevisitCookie();
  }, [hydrated, loggedIn, path, router]);

  return <>{children}</>;
}
