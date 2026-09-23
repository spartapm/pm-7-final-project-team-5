"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { afterAuthPath } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function SplashPage() {
  const router = useRouter();
  const { hydrated, loggedIn, seenOnboarding, onboarded, nickname, seenWelcome } = useStore();
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      setShow(false);
      if (loggedIn) {
        router.replace(afterAuthPath(nickname, seenWelcome));
      } else {
        router.replace("/home");
      }
    }, 1400);
    return () => clearTimeout(t);
  }, [hydrated, loggedIn, seenOnboarding, onboarded, nickname, seenWelcome, router]);

  if (!show && !hydrated) return <div className="shell" />;

  return (
    <PhoneShell>
      <div className="splash">
        <img src="/brand/splash-navy.png" alt="인플롯 INPLOT" className="splash-art" width={390} height={844} />
      </div>
    </PhoneShell>
  );
}
