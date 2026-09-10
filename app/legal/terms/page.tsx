"use client";

import { useRouter } from "next/navigation";
import { BackChevron } from "@/components/icons";
import { PhoneShell } from "@/components/ui";
import { TERMS_BODY } from "@/lib/legal";

export default function TermsPage() {
  const router = useRouter();
  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()} aria-label="뒤로">
          <BackChevron />
        </button>
        <h1 className="h1">이용약관</h1>
        <span />
      </div>
      <div className="scroll">
        <pre className="legal-doc">{TERMS_BODY}</pre>
      </div>
    </PhoneShell>
  );
}
