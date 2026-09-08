"use client";

import { useState } from "react";
import { moodOptions, reasonGroups, toPick } from "@/lib/categories";
import { formatPrice, formatQty, formatWhen, sideLabel, todayKey } from "@/lib/format";
import { isOverseas, priceUnit } from "@/lib/markets";
import { bumpQty, parseNum, pricePlaceholder } from "@/lib/money";
import { NumPad, PadField, type PadKind } from "@/components/NumPad";
import { useStore } from "@/lib/store";
import type { CategoryPick, DraftTrade } from "@/lib/types";

export function TradeWizard({
  draft,
  setDraft,
  onSave,
  savingLabel,
  onClose,
}: {
  draft: DraftTrade;
  setDraft: (next: DraftTrade) => void;
  onSave: () => void;
  savingLabel: string;
  onClose?: () => void;
}) {
  const { showToast } = useStore();
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState("차트를 보고");
  const [ask, setAsk] = useState(false);
  const [pad, setPad] = useState<PadKind | null>(null);
  const groups = reasonGroups();
  const moods = moodOptions(draft.side);
  const side = sideLabel(draft.side);
  const overseas = draft.stock ? isOverseas(draft.stock.market) : false;
  const unit = draft.stock ? priceUnit(draft.stock.market) : "원";
  const market = draft.stock?.market || "KOSPI";
  const canInfo = Boolean(draft.stock) && parseNum(draft.price) > 0 && parseNum(draft.qty) > 0 && Boolean(draft.tradedAt);

  function pickReason(item: CategoryPick) {
    const exists = draft.reasons.some((r) => r.label === item.label);
    if (!exists && draft.reasons.length >= 3) {
      showToast("이 옵션을 선택하려면 하나를 해제해주세요", "info");
      return;
    }
    setDraft({ ...draft, reasons: exists ? draft.reasons.filter((r) => r.label !== item.label) : [...draft.reasons, item] });
  }

  function pickMood(item: CategoryPick) {
    const exists = draft.moods.some((m) => m.label === item.label);
    if (!exists && draft.moods.length >= 2) {
      showToast("이 옵션을 선택하려면 하나를 해제해주세요", "info");
      return;
    }
    setDraft({ ...draft, moods: exists ? draft.moods.filter((m) => m.label !== item.label) : [...draft.moods, item] });
  }

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => (step <= 1 ? onClose?.() : setStep((s) => s - 1))} aria-label="뒤로">
          ‹
        </button>
        <span className="h1" style={{ fontSize: 16 }}>
          {side} 기록 {step}/3 단계
        </span>
        <span />
      </div>
      <div className="step-track" aria-hidden>
        <i style={{ width: `${(step / 3) * 100}%` }} />
      </div>
      <div className="scroll">
        {step === 1 && (
          <>
            <h1 className="step-title">{draft.stock?.name}</h1>
            <p className="sub">
              {draft.stock?.code} · {draft.stock?.marketName}
              {overseas ? " · USD, 소수점 둘째 자리" : ""}
            </p>
            <div className="field-row">
              <div style={{ flex: 1 }}>
                <PadField
                  label={`${draft.side === "buy" ? "매수가" : "매도가"} (${unit})`}
                  value={draft.price}
                  placeholder={pricePlaceholder(market)}
                  onOpen={() => setPad("price")}
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>수량</label>
                <div className="qty-row">
                  <button type="button" className="qty-btn" onClick={() => setDraft({ ...draft, qty: bumpQty(draft.qty, -1) })}>
                    -
                  </button>
                  <button className="pad-value" type="button" onClick={() => setPad("qty")}>
                    {draft.qty || "0"}
                  </button>
                  <button type="button" className="qty-btn" onClick={() => setDraft({ ...draft, qty: bumpQty(draft.qty, 1) })}>
                    +
                  </button>
                </div>
              </div>
            </div>
            <PadField label="매매일자" value={draft.tradedAt} onOpen={() => setPad("date")} />
            <PadField label="매매 시각 (선택)" value={draft.tradedTime || "생략"} onOpen={() => setPad("time")} />
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="step-title">이번 {side}는 무엇을 보고 결정하셨어요?</h1>
            <p className="sub">최대 3개까지 고를 수 있어요. ({draft.reasons.length}/3)</p>
            <div className="acc" style={{ marginTop: 16 }}>
              {groups.map((g) => (
                <div className="acc-item" key={g.group}>
                  <button className={open === g.group ? "acc-h open" : "acc-h"} type="button" onClick={() => setOpen(open === g.group ? "" : g.group)}>
                    {g.group}
                    <span>{open === g.group ? "▾" : "▸"}</span>
                  </button>
                  {open === g.group && (
                    <div className="acc-body">
                      {g.items.map((item) => {
                        const on = draft.reasons.some((r) => r.label === item.label);
                        return (
                          <button key={item.label} type="button" className={on ? "chip on" : "chip"} onClick={() => pickReason(toPick(item))}>
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="step-title">당시 어떤 상태였나요?</h1>
            <p className="sub">최대 2개까지 고를 수 있어요. ({draft.moods.length}/2)</p>
            <div className="mood-list" style={{ marginTop: 16 }}>
              {moods.map((m) => {
                const on = draft.moods.some((x) => x.label === m.label);
                return (
                  <button key={m.label} type="button" className={on ? "mood on" : "mood"} onClick={() => pickMood(toPick(m))}>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
      <div className="footer-cta">
        {step < 3 ? (
          <button
            className="btn btn-primary"
            type="button"
            disabled={step === 1 ? !canInfo : draft.reasons.length === 0}
            onClick={() => setStep((s) => s + 1)}
          >
            다음
          </button>
        ) : (
          <button className="btn btn-primary" type="button" disabled={draft.moods.length === 0} onClick={() => setAsk(true)}>
            {savingLabel}
          </button>
        )}
      </div>
      {ask ? (
        <div className="modal-back">
          <div className="modal">
            <h3>이 내용으로 저장할까요?</h3>
            <p>저장하면 기록 상세에서 확인할 수 있어요.</p>
            <button className="btn btn-primary" type="button" style={{ marginBottom: 8 }} onClick={onSave}>
              네
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setAsk(false)}>
              아니요
            </button>
          </div>
        </div>
      ) : null}
      {pad ? (
        <NumPad
          kind={pad}
          value={pad === "price" ? draft.price : pad === "qty" ? draft.qty : pad === "date" ? draft.tradedAt : draft.tradedTime}
          market={market}
          onCommit={(next) => {
            if (pad === "price") setDraft({ ...draft, price: next });
            else if (pad === "qty") setDraft({ ...draft, qty: next });
            else if (pad === "date") setDraft({ ...draft, tradedAt: next > todayKey() ? todayKey() : next });
            else setDraft({ ...draft, tradedTime: next });
          }}
          onClose={() => setPad(null)}
        />
      ) : null}
    </>
  );
}

export function DraftReview({ draft }: { draft: DraftTrade }) {
  const price = Number(draft.price.replace(/,/g, ""));
  const qty = Number(draft.qty.replace(/,/g, ""));
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <dl className="detail-kv">
        <dt>구분</dt>
        <dd className={draft.side === "buy" ? "side-buy" : "side-sell"}>{sideLabel(draft.side)}</dd>
        <dt>종목</dt>
        <dd>
          {draft.stock?.name ?? "-"} ({draft.stock?.code ?? "-"})
        </dd>
        <dt>가격</dt>
        <dd>{draft.stock && Number.isFinite(price) && price > 0 ? formatPrice(price, draft.stock.market) : "-"}</dd>
        <dt>수량</dt>
        <dd>{Number.isFinite(qty) && qty > 0 ? formatQty(qty) : "-"}</dd>
        <dt>일시</dt>
        <dd>{formatWhen(draft.tradedAt, draft.tradedTime)}</dd>
      </dl>
    </div>
  );
}
