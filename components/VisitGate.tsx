"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { rememberNext } from "@/lib/next-path";
import { useStore } from "@/lib/store";

const OPEN = ["/", "/onboarding", "/login", "/signup", "/legal", "/auth", "/welcome"];

export function VisitGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { hydrated, loggedIn, seenOnboarding } = useStore();

  useEffect(() => {
    if (!hydrated) return;
    if (loggedIn) return;
    const open = OPEN.some((p) => path === p || path.startsWith(p + "/"));
    if (open) return;
    const full = path + (typeof window !== "undefined" ? window.location.search : "");
    if (!seenOnboarding) {
      rememberNext(full);
      router.replace("/onboarding");
    }
  }, [hydrated, loggedIn, seenOnboarding, path, router]);

  return <>{children}</>;
}
