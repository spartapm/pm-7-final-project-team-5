"use client";

import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { PRIVACY_BODY } from "@/lib/legal";

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()} aria-label="뒤로">
          ‹
        </button>
        <h1 className="h1">개인정보 처리방침</h1>
        <span />
      </div>
      <div className="scroll">
        <pre className="legal-doc">{PRIVACY_BODY}</pre>
      </div>
    </PhoneShell>
  );
}
