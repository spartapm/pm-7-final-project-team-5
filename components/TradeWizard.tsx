"use client";

import { useState } from "react";
import { moodOptions, reasonGroups, toPick } from "@/lib/categories";
import { formatPrice, formatQty, formatWhen, sideLabel, todayKey } from "@/lib/format";
import { tradePriceCaption } from "@/lib/markets";
import { bumpQty, displayPriceValue, parseNum, pricePlaceholder } from "@/lib/money";
import { BackChevron } from "@/components/icons";
import { NumPad, PadField, type PadKind } from "@/components/NumPad";
import { useStore } from "@/lib/store";
import type { CategoryPick, DraftTrade } from "@/lib/types";

export function TradeWizard({
  draft,
  setDraft,
  onSave,
  savingLabel,
  onClose,
  mode = "create",
}: {
  draft: DraftTrade;
  setDraft: (next: DraftTrade) => void;
  onSave: () => void;
  savingLabel: string;
  onClose?: () => void;
  mode?: "create" | "edit";
}) {
  const { showToast } = useStore();
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [ask, setAsk] = useState(false);
  const [pad, setPad] = useState<PadKind | null>(null);
  const groups = reasonGroups();
  const moods = moodOptions(draft.side);
  const side = sideLabel(draft.side);
  const market = draft.stock?.market || "KOSPI";
  const priceLabel = tradePriceCaption(draft.side, market);
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
      <div className="topbar wizard-head">
        <button className="icon-btn" type="button" onClick={() => (step <= 1 ? onClose?.() : setStep((s) => s - 1))} aria-label="뒤로">
          <BackChevron />
        </button>
        <span className="wizard-kicker">
          {side} 기록 · {step} / 3 단계
        </span>
      </div>
      <div className="step-track slim" aria-hidden>
        <i style={{ width: `${(step / 3) * 100}%` }} />
      </div>
      <div className="scroll">
        {step === 1 && (
          <>
            <h1 className="step-title">어떤 {side}였나요?</h1>
            <p className="step-kicker">종목명</p>
            <p className="stock-line">
              <b>{draft.stock?.name} </b>
              <span>
                ({draft.stock?.code} · {draft.stock?.marketName})
              </span>
            </p>
            <div className="field-row">
              <div style={{ flex: 1 }}>
                <PadField
                  label={priceLabel}
                  value={displayPriceValue(draft.price, market)}
                  placeholder={pricePlaceholder(market)}
                  align="right"
                  onOpen={() => setPad("price")}
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>수량</label>
                <div className="qty-box">
                  <button type="button" className="qty-pm" onClick={() => setDraft({ ...draft, qty: bumpQty(draft.qty, -1) })}>
                    -
                  </button>
                  <button className="pad-value qty-num" type="button" onClick={() => setPad("qty")}>
                    {draft.qty || "0"}주
                  </button>
                  <button type="button" className="qty-pm" onClick={() => setDraft({ ...draft, qty: bumpQty(draft.qty, 1) })}>
                    +
                  </button>
                </div>
              </div>
            </div>
            <div className="field-row">
              <div style={{ flex: 1 }}>
                <PadField label="매매일자" value={draft.tradedAt} align="right" onOpen={() => setPad("date")} />
              </div>
              <div style={{ flex: 1 }}>
                <PadField label="시간 (선택)" value={draft.tradedTime} placeholder="00:00" align="right" onOpen={() => setPad("time")} />
              </div>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="step-title">이번 {side}는 무엇을 보고 결정하셨어요?</h1>
            <p className="sub">
              {draft.side === "buy" ? (
                <>
                  매수할 때 참고한 내용을 선택해 주세요.
                  <br />
                </>
              ) : null}
              최대 3개까지 고를 수 있어요. ({draft.reasons.length}/3)
            </p>
            <div className="acc" style={{ marginTop: 16 }}>
              {groups.map((g) => {
                const picked = draft.reasons.some((r) => r.group === g.group);
                const shown = open.has(g.group) || picked;
                return (
                <div className={`acc-item ${shown ? "has" : ""}`} key={g.group}>
                  <button
                    className={shown ? "acc-h open" : "acc-h"}
                    type="button"
                    onClick={() => {
                      setOpen((prev) => {
                        const next = new Set<string>();
                        if (!prev.has(g.group)) next.add(g.group);
                        return next;
                      });
                    }}
                  >
                    {g.group}
                    <span>{shown ? "▾" : "▸"}</span>
                  </button>
                  {shown && (
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
                );
              })}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="step-title">그때 마음은 어떠셨어요?</h1>
            <p className="sub">가장 가까운 마음을 골라주세요. (최대 2개)</p>
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
        {mode === "edit" && step === 1 ? (
          <button className="btn btn-primary" type="button" disabled={!canInfo} onClick={onSave}>
            {savingLabel}
          </button>
        ) : step < 3 ? (
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
            <h3>이대로 저장할까요?</h3>
            <p>매매 이유와 그때 마음은 저장 후 수정이 어려워요.</p>
            <button className="btn btn-primary" type="button" style={{ marginBottom: 8 }} onClick={onSave}>
              네
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => setAsk(false)}>
              아니오
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
