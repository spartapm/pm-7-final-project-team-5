"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { BackChevron } from "@/components/icons";
import { NumPad, PadField } from "@/components/NumPad";
import { PhoneShell } from "@/components/ui";
import { formatPrice, sideLabel } from "@/lib/format";
import { displayPriceValue, parseNum, sanitizePrice } from "@/lib/money";
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

  useEffect(() => {
    if (!plan) return;
    if (new URLSearchParams(window.location.search).get("edit") !== "1") return;
    setBuyMin(plan.buyMin != null ? sanitizePrice(String(plan.buyMin), plan.market) : "0");
    setBuyMax(plan.buyMax != null ? sanitizePrice(String(plan.buyMax), plan.market) : "0");
    setStopLoss(plan.stopLoss != null ? sanitizePrice(String(plan.stopLoss), plan.market) : "0");
    setTakeProfit(plan.takeProfit != null ? sanitizePrice(String(plan.takeProfit), plan.market) : "0");
    setEditing(true);
  }, [plan]);

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

  function startEdit() {
    if (!plan) return;
    setBuyMin(plan.buyMin != null ? sanitizePrice(String(plan.buyMin), plan.market) : "0");
    setBuyMax(plan.buyMax != null ? sanitizePrice(String(plan.buyMax), plan.market) : "0");
    setStopLoss(plan.stopLoss != null ? sanitizePrice(String(plan.stopLoss), plan.market) : "0");
    setTakeProfit(plan.takeProfit != null ? sanitizePrice(String(plan.takeProfit), plan.market) : "0");
    setEditing(true);
  }

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => (editing ? setEditing(false) : router.back())} aria-label="뒤로">
          <BackChevron />
        </button>
        <h1 className="h1">{editing ? plan.stockName : "계획 상세"}</h1>
        <span />
      </div>
      <div className="scroll">
        {editing ? (
          <>
            <p className="sub">
              {plan.stockName} · {sideLabel(plan.side)} · {plan.market}
            </p>
            {plan.side === "buy" ? (
              <>
                <PadField label="최소 희망가" value={displayPriceValue(buyMin, plan.market)} align="right" onOpen={() => setPad("buyMin")} />
                <PadField label="최대 희망가" value={displayPriceValue(buyMax, plan.market)} align="right" onOpen={() => setPad("buyMax")} />
              </>
            ) : (
              <>
                <PadField label="손절가" value={displayPriceValue(stopLoss, plan.market)} align="right" onOpen={() => setPad("stopLoss")} />
                <PadField label="목표가" value={displayPriceValue(takeProfit, plan.market)} align="right" onOpen={() => setPad("takeProfit")} />
              </>
            )}
          </>
        ) : (
          <div className="card plan-detail">
            <span className={plan.side === "buy" ? "badge" : "badge sell-badge"}>{sideLabel(plan.side)} 계획</span>
            <dl className="detail-kv">
              <dt>종목</dt>
              <dd>
                {plan.stockName} ({plan.stockCode})
              </dd>
              {plan.side === "buy" ? (
                <>
                  <dt>최소 희망가</dt>
                  <dd>{plan.buyMin != null ? formatPrice(plan.buyMin, plan.market) : "-"}</dd>
                  <dt>최대 희망가</dt>
                  <dd>{plan.buyMax != null ? formatPrice(plan.buyMax, plan.market) : "-"}</dd>
                </>
              ) : (
                <>
                  <dt>손절가</dt>
                  <dd>{plan.stopLoss != null ? formatPrice(plan.stopLoss, plan.market) : "-"}</dd>
                  <dt>목표가</dt>
                  <dd>{plan.takeProfit != null ? formatPrice(plan.takeProfit, plan.market) : "-"}</dd>
                </>
              )}
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
