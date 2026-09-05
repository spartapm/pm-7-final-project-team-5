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
      if (loggedIn) router.replace(afterAuthPath(nickname, seenWelcome));
      else if (onboarded) router.replace("/home");
      else if (seenOnboarding) router.replace("/login");
      else router.replace("/onboarding");
    }, 1400);
    return () => clearTimeout(t);
  }, [hydrated, loggedIn, seenOnboarding, onboarded, nickname, seenWelcome, router]);

  if (!show && !hydrated) return <div className="shell" />;

  return (
    <PhoneShell>
      <div className="splash">
        <div>
          <div className="mark">P</div>
          <div style={{ fontWeight: 800, fontSize: 22 }}>패턴노트</div>
          <div style={{ opacity: 0.7, marginTop: 8, fontSize: 13 }}>3번만 기록하면, 습관이 보여요</div>
        </div>
      </div>
    </PhoneShell>
  );
}
