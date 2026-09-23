"use client";

import { useEffect, useRef, useState } from "react";
import { MoodPicker, ReasonPicker } from "@/components/ReasonPicker";
import { moodOptions } from "@/lib/categories";
import { ensureRecordSession, TAXONOMY_VERSION, trackOnce } from "@/lib/analytics";
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
  guest = false,
}: {
  draft: DraftTrade;
  setDraft: (next: DraftTrade) => void;
  onSave: () => void;
  savingLabel: string;
  onClose?: () => void;
  mode?: "create" | "edit";
  guest?: boolean;
}) {
  const { showToast } = useStore();
  const [step, setStep] = useState(1);
  const [ask, setAsk] = useState(false);
  const [pad, setPad] = useState<PadKind | null>(null);
  const moods = moodOptions(draft.side);
  const side = sideLabel(draft.side);
  const market = draft.stock?.market || "KOSPI";
  const priceLabel = tradePriceCaption(draft.side, market);
  const canInfo = Boolean(draft.stock) && parseNum(draft.price) > 0 && parseNum(draft.qty) > 0 && Boolean(draft.tradedAt);
  const fired = useRef({ reason: false, state: false });

  useEffect(() => {
    if (mode !== "create") return;
    const sid = ensureRecordSession("direct");
    const reasonCount = 33;
    if (step === 2 && !fired.current.reason) {
      fired.current.reason = true;
      trackOnce(`reason_axis:${sid}`, "reason_axis_start", {
        record_session_id: sid,
        trade_type: draft.side,
        reason_option_count: reasonCount,
        screen_name: "reason_axis",
      });
    }
    if (step === 3 && !fired.current.state) {
      fired.current.state = true;
      trackOnce(`state_axis:${sid}`, "state_axis_start", {
        record_session_id: sid,
        trade_type: draft.side,
        reason_category_ids: draft.reasons.map((r) => r.meta || r.label),
        reason_count: draft.reasons.length,
        state_option_count: moodOptions(draft.side).length,
        taxonomy_version: TAXONOMY_VERSION,
        screen_name: "state_axis",
      });
    }
  }, [step, mode, draft.side, draft.reasons]);

  function setReasons(next: CategoryPick[]) {
    if (next.length > 3) {
      showToast("이 옵션을 선택하려면 하나를 해제해주세요", "info");
      return;
    }
    setDraft({ ...draft, reasons: next });
  }

  function setMoods(next: CategoryPick[]) {
    if (next.length > 2) {
      showToast("이 옵션을 선택하려면 하나를 해제해주세요", "info");
      return;
    }
    setDraft({ ...draft, moods: next });
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
      {step === 1 ? (
        <div className="scroll">
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
        </div>
      ) : null}
      {step === 2 ? (
        <div className="reason-step">
          <ReasonPicker selected={draft.reasons} onChange={setReasons} onComplete={() => setStep(3)} />
        </div>
      ) : null}
      {step === 3 ? (
        <>
          <div className="scroll reason-mood-scroll">
            <h1 className="step-title">그때 마음은 어떠셨어요?</h1>
            <p className="sub">가장 가까운 마음을 골라주세요. (최대 2개)</p>
            <MoodPicker items={moods} selected={draft.moods} onChange={setMoods} />
          </div>
          <div className="reason-bar">
            <div className="reason-chips">
              {draft.moods.map((item) => (
                <span key={item.meta || item.label} className="reason-chip">
                  <em>{item.label}</em>
                  <button
                    type="button"
                    aria-label={`${item.label} 삭제`}
                    onClick={() => setMoods(draft.moods.filter((m) => (m.meta || m.label) !== (item.meta || item.label)))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="reason-bar-row">
              <span className="reason-count">{draft.moods.length}개 선택</span>
              <button className="btn btn-primary reason-done" type="button" disabled={draft.moods.length === 0} onClick={() => setAsk(true)}>
                {savingLabel}
              </button>
            </div>
          </div>
        </>
      ) : null}
      {step === 1 ? (
        <div className="footer-cta">
          {mode === "edit" ? (
            <button className="btn btn-primary" type="button" disabled={!canInfo} onClick={onSave}>
              {savingLabel}
            </button>
          ) : (
            <button className="btn btn-primary" type="button" disabled={!canInfo} onClick={() => setStep(2)}>
              다음
            </button>
          )}
        </div>
      ) : null}
      {ask ? (
        <div className="modal-back">
          <div className={guest ? "modal save-confirm" : "modal"}>
            {guest ? (
              <button className="sheet-x" type="button" onClick={() => setAsk(false)} aria-label="닫기">
                ✕
              </button>
            ) : null}
            <h3>{guest ? "저장하시겠어요?" : "이대로 저장할까요?"}</h3>
            <p>
              {guest
                ? "로그인하면 매매 기록을 저장하고 계속 쌓아볼 수 있어요."
                : "매매 이유와 그때 마음은 저장 후 수정이 어려워요."}
            </p>
            <button className="btn btn-primary" type="button" style={{ marginBottom: 8 }} onClick={onSave}>
              {guest ? "로그인/회원가입하고 저장하기" : "네"}
            </button>
            {guest ? null : (
              <button className="btn btn-ghost" type="button" onClick={() => setAsk(false)}>
                아니오
              </button>
            )}
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
