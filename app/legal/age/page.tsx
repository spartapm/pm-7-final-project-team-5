"use client";

import { useRouter } from "next/navigation";
import { BackChevron } from "@/components/icons";
import { PhoneShell } from "@/components/ui";
import { AGE_BODY } from "@/lib/legal";

export default function AgePage() {
  const router = useRouter();
  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()} aria-label="뒤로">
          <BackChevron />
        </button>
        <h1 className="h1">만 14세 확인</h1>
        <span />
      </div>
      <div className="scroll">
        <pre className="legal-doc">{AGE_BODY}</pre>
      </div>
    </PhoneShell>
  );
}
