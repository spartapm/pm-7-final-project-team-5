"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { todayKey } from "@/lib/format";
import { isOverseas } from "@/lib/markets";
import { capPriceRaw, capQtyRaw, displayPriceValue, sanitizePrice, sanitizeQty } from "@/lib/money";

export type PadKind = "price" | "qty" | "date" | "time";

function digitsOf(v: string) {
  return v.replace(/[^\d]/g, "");
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
    if (kind === "price") return displayPriceValue(sanitizePrice(buf || "0", market), market);
    if (kind === "qty") return sanitizeQty(buf || "0");
    return buf;
  }

  function tap(key: string) {
    if (key === "ok") {
      if (kind === "price") onCommit(sanitizePrice(buf || "0", market));
      else if (kind === "qty") onCommit(sanitizeQty(buf || "0"));
      onClose();
      return;
    }
    if (key === "back") {
      setBuf((s) => s.slice(0, -1));
      return;
    }
    if (key === ".") {
      if (kind === "price" && !overseas) return;
      if (buf.includes(".")) return;
      setBuf((s) => (s || "0") + ".");
      return;
    }
    if (key === "00") {
      setBuf((s) => {
        const next = !s || s === "0" ? "0" : s + "00";
        return kind === "price" ? capPriceRaw(next, market) : capQtyRaw(next);
      });
      return;
    }
    setBuf((s) => {
      const next = !s || s === "0" ? key : s + key;
      return kind === "price" ? capPriceRaw(next, market) : capQtyRaw(next);
    });
  }

  const keys =
    kind === "price" && !overseas
      ? ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "back"]
      : ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];

  const title = kind === "price" ? "가격" : kind === "qty" ? "수량" : kind === "date" ? "매매일자" : "매매 시각";

  return (
    <div className="num-pad-back" onClick={onClose}>
      <div className="num-pad" onClick={(e) => e.stopPropagation()}>
        <div className="num-pad-head">
          <span>{title}</span>
          {kind === "price" || kind === "qty" ? <b>{shown()}</b> : null}
        </div>
        {kind === "date" ? (
          <DateCal
            value={value}
            onPick={(next) => {
              onCommit(next);
              onClose();
            }}
          />
        ) : null}
        {kind === "time" ? (
          <TimeWheel
            value={value}
            onPick={(next) => {
              onCommit(next);
              onClose();
            }}
            onSkip={() => {
              onCommit("");
              onClose();
            }}
          />
        ) : null}
        {kind === "price" || kind === "qty" ? (
          <>
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
          </>
        ) : null}
      </div>
    </div>
  );
}

function DateCal({ value, onPick }: { value: string; onPick: (next: string) => void }) {
  const today = todayKey();
  const initial = /^\d{4}-\d{2}-\d{2}$/.test(value) && value <= today ? value : today;
  const [cursor, setCursor] = useState(initial.slice(0, 7));
  const [y, m] = cursor.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const start = first.getDay();
  const days = new Date(y, m, 0).getDate();
  const cells = useMemo(() => {
    const list: (number | null)[] = [...Array(start).fill(null)];
    for (let d = 1; d <= days; d++) list.push(d);
    return list;
  }, [start, days]);

  function prev() {
    const d = new Date(y, m - 2, 1);
    setCursor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  function next() {
    const d = new Date(y, m, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key <= today.slice(0, 7)) setCursor(key);
  }

  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" onClick={prev}>
          ‹
        </button>
        <b>
          {y}.{String(m).padStart(2, "0")}
        </b>
        <button type="button" onClick={next}>
          ›
        </button>
      </div>
      <div className="cal-grid cal-dow">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const disabled = key > today;
          return (
            <button key={key} type="button" className={key === initial ? "on" : ""} disabled={disabled} onClick={() => onPick(key)}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WheelCol({ items, value, onChange, label }: { items: number[]; value: number; onChange: (next: number) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const skip = useRef(false);

  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const el = box.querySelector<HTMLElement>(`[data-v="${value}"]`);
    if (!el) return;
    skip.current = true;
    el.scrollIntoView({ block: "center" });
    window.setTimeout(() => {
      skip.current = false;
    }, 80);
  }, [value]);

  function pickFromScroll() {
    const box = ref.current;
    if (!box || skip.current) return;
    const mid = box.scrollTop + box.clientHeight / 2;
    let best = value;
    let bestDist = Infinity;
    box.querySelectorAll<HTMLElement>("[data-v]").forEach((node) => {
      const center = node.offsetTop + node.offsetHeight / 2;
      const dist = Math.abs(center - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = Number(node.dataset.v);
      }
    });
    if (best !== value) onChange(best);
  }

  return (
    <div className="wheel-col-wrap">
      <div className="wheel-col" ref={ref} onScroll={pickFromScroll} aria-label={label} role="listbox">
        {items.map((n) => (
          <button
            key={n}
            type="button"
            data-v={n}
            className={n === value ? "on" : ""}
            role="option"
            aria-selected={n === value}
            onClick={() => {
              onChange(n);
              const box = ref.current;
              const el = box?.querySelector<HTMLElement>(`[data-v="${n}"]`);
              el?.scrollIntoView({ block: "center", behavior: "smooth" });
            }}
          >
            {String(n).padStart(2, "0")}
          </button>
        ))}
      </div>
    </div>
  );
}

function TimeWheel({ value, onPick, onSkip }: { value: string; onPick: (next: string) => void; onSkip: () => void }) {
  const parsed = /^(\d{2}):(\d{2})$/.test(value) ? value : "00:00";
  const [hh, setHh] = useState(Number(parsed.slice(0, 2)));
  const [mm, setMm] = useState(Number(parsed.slice(3, 5)));
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);
  return (
    <div>
      <div className="time-wheel">
        <WheelCol items={hours} value={hh} onChange={setHh} label="시" />
        <span className="wheel-colon">:</span>
        <WheelCol items={minutes} value={mm} onChange={setMm} label="분" />
      </div>
      <button
        className="btn btn-primary"
        type="button"
        style={{ marginTop: 10 }}
        onClick={() => onPick(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`)}
      >
        완료
      </button>
      <button className="btn btn-ghost" type="button" style={{ marginTop: 8 }} onClick={onSkip}>
        시각 생략
      </button>
    </div>
  );
}

export function PadField({
  label,
  value,
  placeholder,
  unit,
  align = "left",
  onOpen,
}: {
  label: string;
  value: string;
  placeholder?: string;
  unit?: string;
  align?: "left" | "right";
  onOpen: () => void;
}) {
  return (
    <div className="field">
      <label className="pad-label">
        <span>{label}</span>
        {unit ? <span className="pad-unit">{unit}</span> : null}
      </label>
      <button className={`pad-value ${align === "right" ? "end" : ""}`} type="button" onClick={onOpen}>
        {value || placeholder || "0"}
      </button>
    </div>
  );
}
