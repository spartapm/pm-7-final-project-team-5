"use client";

import { useState } from "react";
import { SCHEMA_SQL } from "@/lib/schema-sql";
import { useStore } from "@/lib/store";

export function CloudBanner() {
  const { cloudStatus } = useStore();
  const [copied, setCopied] = useState(false);
  if (cloudStatus !== "missing-table") return null;
  return (
    <div className="cloud-banner">
      <div className="cloud-banner-title">Supabase 테이블이 아직 없습니다</div>
      <div className="cloud-banner-body">
        <a href="https://supabase.com/dashboard/project/cwvbkmiawjruzlxdbmfq/sql/new" target="_blank" rel="noreferrer">
          SQL Editor 열기
        </a>
        에 스키마를 붙여넣고 Run 하면 기기 간에 기록이 동기화됩니다.
      </div>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(SCHEMA_SQL).catch(() => undefined);
          setCopied(true);
        }}
      >
        {copied ? "복사됨" : "SQL 복사"}
      </button>
    </div>
  );
}
