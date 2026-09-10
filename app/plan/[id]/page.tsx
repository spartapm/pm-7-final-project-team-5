"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { BackChevron } from "@/components/icons";
import { NumPad, PadField } from "@/components/NumPad";
import { PhoneShell } from "@/components/ui";
import { sideLabel } from "@/lib/format";
import { currencyHint, priceUnit } from "@/lib/markets";
import { displayPriceValue, parseNum } from "@/lib/money";
import { planSummary } from "@/lib/plans";
import { useStore } from "@/lib/store";

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { hydrated, plans, updatePlan, showToast } = useStore();
  const plan = plans.find((p) => p.id === id);
  const [editing, setEditing] = useState(false);
  const [buyMin, setBuyMin] = useState("");
  const [buyMax, setBuyMax] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [pad, setPad] = useState<"buyMin" | "buyMax" | "stopLoss" | "takeProfit" | null>(null);

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

  const unit = priceUnit(plan.market);

  function startEdit() {
    setBuyMin(plan!.buyMin != null ? String(plan!.buyMin) : "0");
    setBuyMax(plan!.buyMax != null ? String(plan!.buyMax) : "0");
    setStopLoss(plan!.stopLoss != null ? String(plan!.stopLoss) : "0");
    setTakeProfit(plan!.takeProfit != null ? String(plan!.takeProfit) : "0");
    setEditing(true);
  }

  useEffect(() => {
    if (typeof window === "undefined" || !plan) return;
    if (new URLSearchParams(window.location.search).get("edit") === "1") startEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id]);

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => (editing ? setEditing(false) : router.back())} aria-label="뒤로">
          <BackChevron />
        </button>
        <h1 className="h1">{plan.stockName}</h1>
        <span />
      </div>
      <div className="scroll">
        {editing ? (
          <>
            <p className="sub">
              {plan.stockName} · {sideLabel(plan.side)} · {plan.market}
            </p>
            <p className="currency-hint">{currencyHint(plan.market)}</p>
            {plan.side === "buy" ? (
              <>
                <PadField label={`최소 희망가 (${unit})`} value={displayPriceValue(buyMin, plan.market)} onOpen={() => setPad("buyMin")} />
                <PadField label={`최대 희망가 (${unit})`} value={displayPriceValue(buyMax, plan.market)} onOpen={() => setPad("buyMax")} />
              </>
            ) : (
              <>
                <PadField label={`손절가 (${unit})`} value={displayPriceValue(stopLoss, plan.market)} onOpen={() => setPad("stopLoss")} />
                <PadField label={`목표가 (${unit})`} value={displayPriceValue(takeProfit, plan.market)} onOpen={() => setPad("takeProfit")} />
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
                  showToast("최소 희망가는 최대 희망가보다 작거나 같아야해요", "err");
                  return;
                }
                updatePlan(plan.id, { buyMin: min, buyMax: max });
              } else {
                const stop = parseNum(stopLoss);
                const take = parseNum(takeProfit);
                if (!(stop > 0) || !(take > 0) || take < stop) {
                  showToast("손절가는 목표가보다 낮거나 같아야해요", "err");
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
      {pad ? (
        <NumPad
          kind="price"
          value={pad === "buyMin" ? buyMin : pad === "buyMax" ? buyMax : pad === "stopLoss" ? stopLoss : takeProfit}
          market={plan.market}
          onCommit={(next) => {
            if (pad === "buyMin") setBuyMin(next);
            else if (pad === "buyMax") setBuyMax(next);
            else if (pad === "stopLoss") setStopLoss(next);
            else setTakeProfit(next);
          }}
          onClose={() => setPad(null)}
        />
      ) : null}
    </PhoneShell>
  );
}
