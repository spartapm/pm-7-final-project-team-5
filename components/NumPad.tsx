"use client";

import { useState } from "react";
import { todayKey } from "@/lib/format";
import { isOverseas } from "@/lib/markets";
import { sanitizePrice, sanitizeQty } from "@/lib/money";

export type PadKind = "price" | "qty" | "date" | "time";

function digitsOf(v: string) {
  return v.replace(/[^\d]/g, "");
}

function showDate(raw: string) {
  const d = digitsOf(raw).slice(0, 8);
  const y = d.slice(0, 4);
  const m = d.slice(4, 6);
  const day = d.slice(6, 8);
  if (d.length <= 4) return y || "YYYY";
  if (d.length <= 6) return `${y}-${m}`;
  return `${y}-${m}-${day}`;
}

function showTime(raw: string) {
  const d = digitsOf(raw).slice(0, 4);
  if (!d) return "선택 안 함";
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

function commitDate(raw: string) {
  const d = digitsOf(raw).slice(0, 8);
  if (d.length !== 8) return todayKey();
  const next = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  if (next > todayKey()) return todayKey();
  return next;
}

function commitTime(raw: string) {
  const d = digitsOf(raw).slice(0, 4);
  if (!d) return "";
  const hh = Math.min(23, Number(d.slice(0, 2) || "0"));
  const mm = Math.min(59, Number((d.slice(2) || "0").padEnd(2, "0")));
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function NumPad({
  kind,
  value,
  market = "KOSPI",
  onCommit,
  onClose,
}: {
  kind: PadKind;
  value: string;
  market?: string;
  onCommit: (next: string) => void;
  onClose: () => void;
}) {
  const [buf, setBuf] = useState(() => (kind === "date" || kind === "time" ? digitsOf(value) : value.replace(/,/g, "")));
  const overseas = isOverseas(market);

  function shown() {
    if (kind === "price") return sanitizePrice(buf || "0", market);
    if (kind === "qty") return sanitizeQty(buf || "0");
    if (kind === "date") return showDate(buf);
    return showTime(buf);
  }

  function tap(key: string) {
    if (key === "ok") {
      if (kind === "price") onCommit(sanitizePrice(buf || "0", market));
      else if (kind === "qty") onCommit(sanitizeQty(buf || "0"));
      else if (kind === "date") onCommit(commitDate(buf));
      else onCommit(commitTime(buf));
      onClose();
      return;
    }
    if (key === "skip") {
      onCommit("");
      onClose();
      return;
    }
    if (key === "back") {
      setBuf((s) => s.slice(0, -1));
      return;
    }
    if (kind === "date") {
      setBuf((s) => digitsOf(s + key).slice(0, 8));
      return;
    }
    if (kind === "time") {
      setBuf((s) => digitsOf(s + key).slice(0, 4));
      return;
    }
    if (key === ".") {
      if (kind === "price" && !overseas) return;
      if (buf.includes(".")) return;
      setBuf((s) => (s || "0") + ".");
      return;
    }
    if (key === "00") {
      setBuf((s) => (s === "0" || !s ? "0" : s + "00"));
      return;
    }
    setBuf((s) => {
      if (!s || s === "0") return key;
      return s + key;
    });
  }

  const keys =
    kind === "date" || kind === "time" || (kind === "price" && !overseas)
      ? ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "back"]
      : ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];

  const title = kind === "price" ? "가격" : kind === "qty" ? "수량" : kind === "date" ? "매매일자" : "매매 시각";

  return (
    <div className="num-pad-back" onClick={onClose}>
      <div className="num-pad" onClick={(e) => e.stopPropagation()}>
        <div className="num-pad-head">
          <span>{title}</span>
          <b>{shown()}</b>
        </div>
        <div className="num-pad-grid">
          {keys.map((k) => (
            <button key={k} type="button" onClick={() => tap(k)}>
              {k === "back" ? "⌫" : k}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" type="button" style={{ marginTop: 10 }} onClick={() => tap("ok")}>
          완료
        </button>
        {kind === "time" ? (
          <button className="btn btn-ghost" type="button" style={{ marginTop: 8 }} onClick={() => tap("skip")}>
            시각 생략
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function PadField({
  label,
  value,
  placeholder,
  onOpen,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onOpen: () => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <button className="pad-value" type="button" onClick={onOpen}>
        {value || placeholder || "0"}
      </button>
    </div>
  );
}
