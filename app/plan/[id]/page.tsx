"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { Modal, PhoneShell } from "@/components/ui";
import { formatPrice, sideLabel } from "@/lib/format";
import { isOverseas, priceUnit } from "@/lib/markets";
import { parseNum, sanitizePrice } from "@/lib/money";
import { planSummary } from "@/lib/plans";
import { useStore } from "@/lib/store";

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { hydrated, plans, deletePlan, updatePlan, showToast } = useStore();
  const plan = plans.find((p) => p.id === id);
  const [askDelete, setAskDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [buyMin, setBuyMin] = useState("");
  const [buyMax, setBuyMax] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  if (!hydrated) return <div className="shell" />;
  if (!plan) {
    return (
      <PhoneShell>
        <div className="empty">
          <h3>계획을 찾을 수 없어요</h3>
          <button className="btn btn-ghost" type="button" onClick={() => router.replace("/plan")}>
            목록으로
          </button>
        </div>
      </PhoneShell>
    );
  }

  const overseas = isOverseas(plan.market);
  const unit = priceUnit(plan.market);

  function startEdit() {
    setBuyMin(plan!.buyMin != null ? String(plan!.buyMin) : "0");
    setBuyMax(plan!.buyMax != null ? String(plan!.buyMax) : "0");
    setStopLoss(plan!.stopLoss != null ? String(plan!.stopLoss) : "0");
    setTakeProfit(plan!.takeProfit != null ? String(plan!.takeProfit) : "0");
    setEditing(true);
  }

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => (editing ? setEditing(false) : router.back())}>
          ‹
        </button>
        <h1 className="h1">{plan.stockName}</h1>
        {editing ? <span /> : (
          <button className="skip" type="button" onClick={() => setAskDelete(true)}>
            삭제
          </button>
        )}
      </div>
      <div className="scroll">
        {editing ? (
          <>
            <p className="sub">
              {plan.stockName} · {sideLabel(plan.side)} · {plan.market}
            </p>
            {plan.side === "buy" ? (
              <>
                <div className="field" style={{ marginTop: 16 }}>
                  <label>최소 희망가 ({unit})</label>
                  <input inputMode="decimal" value={buyMin} onChange={(e) => setBuyMin(sanitizePrice(e.target.value, plan.market))} />
                </div>
                <div className="field">
                  <label>최대 희망가 ({unit})</label>
                  <input inputMode="decimal" value={buyMax} onChange={(e) => setBuyMax(sanitizePrice(e.target.value, plan.market))} />
                </div>
              </>
            ) : (
              <>
                <div className="field" style={{ marginTop: 16 }}>
                  <label className="danger">손절가 ({unit})</label>
                  <input inputMode="decimal" value={stopLoss} onChange={(e) => setStopLoss(sanitizePrice(e.target.value, plan.market))} />
                </div>
                <div className="field">
                  <label>목표가 ({unit})</label>
                  <input inputMode="decimal" value={takeProfit} onChange={(e) => setTakeProfit(sanitizePrice(e.target.value, plan.market))} />
                </div>
              </>
            )}
          </>
        ) : (
          <div className="card">
            <span className={plan.side === "buy" ? "badge" : "badge sell-badge"}>{sideLabel(plan.side)}</span>
            <dl className="detail-kv">
              <dt>종목</dt>
              <dd>
                {plan.stockName} ({plan.stockCode})
              </dd>
              <dt>요약</dt>
              <dd>{planSummary(plan)}</dd>
            </dl>
          </div>
        )}
      </div>
      {editing ? (
        <div className="footer-cta">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              if (plan.side === "buy") {
                const min = parseNum(buyMin);
                const max = parseNum(buyMax);
                if (!(min > 0) || !(max > 0) || min > max) {
                  showToast("희망 매수 구간을 확인해 주세요", "err");
                  return;
                }
                updatePlan(plan.id, { buyMin: min, buyMax: max });
              } else {
                const stop = parseNum(stopLoss);
                const take = parseNum(takeProfit);
                if (!(stop > 0) || !(take > 0) || take < stop) {
                  showToast("목표가와 손절가를 확인해 주세요", "err");
                  return;
                }
                updatePlan(plan.id, { stopLoss: stop, takeProfit: take });
              }
              setEditing(false);
            }}
          >
            수정 저장
          </button>
        </div>
      ) : (
        <div className="footer-cta">
          <button className="btn btn-primary" type="button" onClick={startEdit}>
            계획 수정
          </button>
        </div>
      )}
      {askDelete ? (
        <Modal
          title="이 계획을 삭제할까요?"
          body="삭제한 계획은 되돌릴 수 없어요. 이미 저장된 기록의 스냅샷은 그대로 남습니다."
          confirm="삭제"
          onCancel={() => setAskDelete(false)}
          onConfirm={() => {
            deletePlan(plan.id);
            router.replace("/plan");
          }}
        />
      ) : null}
    </PhoneShell>
  );
}
