"use client";

import { useState } from "react";
import { StockSearch } from "@/components/StockSearch";
import { moodOptions, reasonGroups, toPick } from "@/lib/categories";
import { formatPrice, formatQty, formatWhen, sideLabel } from "@/lib/format";
import { isOverseas, priceUnit } from "@/lib/markets";
import type { CategoryPick, DraftTrade, Plan, Side } from "@/lib/types";

export function TradeWizard({
  draft,
  setDraft,
  plans,
  onSave,
  savingLabel,
  allowSkip,
  onClose,
  lockStock,
}: {
  draft: DraftTrade;
  setDraft: (next: DraftTrade) => void;
  plans: Plan[];
  onSave: () => void;
  savingLabel: string;
  allowSkip?: boolean;
  onClose?: () => void;
  lockStock?: boolean;
}) {
  const [step, setStep] = useState(draft.stock || lockStock ? 1 : 0);
  const [open, setOpen] = useState<string | null>(null);
  const groups = reasonGroups();
  const moods = moodOptions(draft.side);
  const maxReasons = 3;
  const maxMoods = 2;
  const side = sideLabel(draft.side);
  const overseas = draft.stock ? isOverseas(draft.stock.market) : false;
  const unit = draft.stock ? priceUnit(draft.stock.market) : "원";
  const relatedPlans = draft.stock
    ? plans.filter((p) => p.stockCode === draft.stock?.code)
    : [];

  function toggleReason(pick: CategoryPick) {
    const exists = draft.reasons.some((r) => r.label === pick.label);
    const reasons = exists
      ? draft.reasons.filter((r) => r.label !== pick.label)
      : draft.reasons.length >= maxReasons
        ? draft.reasons
        : [...draft.reasons, pick];
    setDraft({ ...draft, reasons });
  }
  function toggleMood(pick: CategoryPick) {
    const exists = draft.moods.some((m) => m.label === pick.label);
    const next = exists
      ? draft.moods.filter((m) => m.label !== pick.label)
      : draft.moods.length >= maxMoods
        ? draft.moods
        : [...draft.moods, pick];
    setDraft({ ...draft, moods: next });
  }

  const canSave =
    Boolean(draft.stock) &&
    Number(draft.price.replace(/,/g, "")) > 0 &&
    Number(draft.qty.replace(/,/g, "")) > 0 &&
    Boolean(draft.tradedAt);

  function back() {
    if (step <= (lockStock ? 1 : 0)) onClose?.();
    else setStep((s) => s - 1);
  }

  const kicker =
    step === 0
      ? `${side} 기록 · 종목`
      : `${side} 기록 · ${step} / 4 단계`;

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={back} aria-label="뒤로">
          ‹
        </button>
        {allowSkip && step < 4 ? (
          <button className="skip" type="button" onClick={() => setStep((s) => Math.min(4, s + 1))}>
            건너뛰기
          </button>
        ) : (
          <span />
        )}
      </div>
      {step > 0 ? (
        <div className="step-track" aria-hidden>
          <i style={{ width: `${(step / 4) * 100}%` }} />
        </div>
      ) : null}
      <div className="scroll">
        {step === 0 && (
          <>
            <div className="step-kicker">{kicker}</div>
            <h1 className="step-title">종목 검색</h1>
            <StockSearch
              onPick={(s) => {
                setDraft({ ...draft, stock: s, planId: null });
                setStep(1);
              }}
            />
          </>
        )}

        {step === 1 && (
          <>
            <div className="step-kicker">{kicker}</div>
            <h1 className="step-title">기본 매매 정보를 입력해 주세요</h1>
            <p className="sub">
              {draft.stock?.name} · {draft.stock?.code}
              {overseas ? " · 해외 종목은 달러(USD), 소수점 입력 가능" : ""}
            </p>
            <div className="seg sides" style={{ marginTop: 16 }}>
              {(["buy", "sell"] as Side[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`${draft.side === s ? "on" : ""} ${s}`}
                  onClick={() => setDraft({ ...draft, side: s, moods: [] })}
                >
                  {sideLabel(s)}
                </button>
              ))}
            </div>
            <div className="field">
              <label>
                {draft.side === "buy" ? "매수가" : "매도가"} ({unit})
              </label>
              <input
                inputMode="decimal"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                placeholder={overseas ? "0.00" : "0"}
              />
            </div>
            <div className="field">
              <label>수량 (1주 미만도 가능)</label>
              <input
                inputMode="decimal"
                value={draft.qty}
                onChange={(e) => setDraft({ ...draft, qty: e.target.value })}
                placeholder={overseas ? "0.1" : "0"}
              />
            </div>
            <div className="field">
              <label>매매 일자</label>
              <input
                type="date"
                value={draft.tradedAt}
                onChange={(e) => setDraft({ ...draft, tradedAt: e.target.value })}
              />
            </div>
            <div className="field">
              <label>매매 시각</label>
              <input
                type="time"
                value={draft.tradedTime}
                onChange={(e) => setDraft({ ...draft, tradedTime: e.target.value })}
              />
            </div>
            {relatedPlans.length > 0 && (
              <div className="field">
                <label>연결할 계획 (선택)</label>
                {relatedPlans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={draft.planId === p.id ? "mood on" : "mood"}
                    onClick={() => setDraft({ ...draft, planId: draft.planId === p.id ? null : p.id })}
                  >
                    희망 {p.targetBuy ?? "-"} / 손절 {p.stopLoss ?? "-"} / 목표 {p.takeProfit ?? "-"}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div className="step-kicker">{kicker}</div>
            <h1 className="step-title">이번 {side}는 무엇을 보고 결정하셨어요?</h1>
            <p className="sub">
              {side}할 때 참고한 내용을 선택해 주세요. 최대 {maxReasons}개까지 고를 수 있어요. ({draft.reasons.length}/
              {maxReasons})
            </p>
            <div className="acc" style={{ marginTop: 16 }}>
              {groups.map((g) => (
                <div className="acc-item" key={g.group}>
                  <button
                    className={open === g.group ? "acc-h open" : "acc-h"}
                    type="button"
                    onClick={() => setOpen(open === g.group ? null : g.group)}
                  >
                    {g.group}
                    <span>{open === g.group ? "▾" : "▸"}</span>
                  </button>
                  {open === g.group && (
                    <div className="acc-body">
                      {g.items.map((item) => {
                        const on = draft.reasons.some((r) => r.label === item.label);
                        return (
                          <button
                            key={item.label}
                            type="button"
                            className={on ? "chip on" : "chip"}
                            onClick={() => toggleReason(toPick(item))}
                          >
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
            <div className="step-kicker">{kicker}</div>
            <h1 className="step-title">당시 어떤 상태였나요?</h1>
            <p className="sub">
              최대 {maxMoods}개까지 고를 수 있어요. ({draft.moods.length}/{maxMoods})
            </p>
            <div className="mood-list" style={{ marginTop: 16 }}>
              {moods.map((m) => {
                const on = draft.moods.some((x) => x.label === m.label);
                return (
                  <button key={m.label} type="button" className={on ? "mood on" : "mood"} onClick={() => toggleMood(toPick(m))}>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="step-kicker">{kicker}</div>
            <h1 className="step-title">이 내용으로 남길까요?</h1>
            <p className="sub">저장 전에 한 번만 확인해 주세요.</p>
            <DraftReview draft={draft} />
          </>
        )}
      </div>
      <div className="footer-cta">
        {step < 4 ? (
          <button
            className="btn btn-primary"
            type="button"
            disabled={step === 0 ? !draft.stock : step === 1 ? !canSave : false}
            onClick={() => setStep((s) => s + 1)}
          >
            다음
          </button>
        ) : (
          <button className="btn btn-primary" type="button" disabled={!canSave} onClick={onSave}>
            {savingLabel}
          </button>
        )}
      </div>
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
        <dt>시장</dt>
        <dd>{draft.stock?.marketName ?? "-"}</dd>
        <dt>가격</dt>
        <dd>{draft.stock && Number.isFinite(price) && price > 0 ? formatPrice(price, draft.stock.market) : "-"}</dd>
        <dt>수량</dt>
        <dd>{Number.isFinite(qty) && qty > 0 ? formatQty(qty) : "-"}</dd>
        <dt>일시</dt>
        <dd>{formatWhen(draft.tradedAt, draft.tradedTime)}</dd>
        <dt>판단 근거</dt>
        <dd>{draft.reasons.length ? draft.reasons.map((r) => r.label).join(", ") : "선택하지 않음"}</dd>
        <dt>당시 상태</dt>
        <dd>{draft.moods.length ? draft.moods.map((m) => m.label).join(", ") : "선택하지 않음"}</dd>
      </dl>
    </div>
  );
}
