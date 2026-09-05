"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { Modal, PhoneShell } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { isOverseas, priceUnit } from "@/lib/markets";
import { useStore } from "@/lib/store";

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { hydrated, plans, deletePlan, updatePlan, trades } = useStore();
  const plan = plans.find((p) => p.id === id);
  const linked = trades.filter((t) => t.planId === id);
  const [askDelete, setAskDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [targetBuy, setTargetBuy] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [memo, setMemo] = useState("");

  if (!hydrated) return <div className="shell" />;

  if (!plan) {
    return (
      <PhoneShell>
        <div className="empty">
          <h3>계획을 찾을 수 없어요</h3>
          <button className="btn btn-ghost" type="button" onClick={() => router.replace("/plan")}>목록으로</button>
        </div>
      </PhoneShell>
    );
  }

  const overseas = isOverseas(plan.market);
  const unit = priceUnit(plan.market);

  function startEdit() {
    setTargetBuy(plan!.targetBuy != null ? String(plan!.targetBuy) : "");
    setStopLoss(plan!.stopLoss != null ? String(plan!.stopLoss) : "");
    setTakeProfit(plan!.takeProfit != null ? String(plan!.takeProfit) : "");
    setMemo(plan!.memo);
    setEditing(true);
  }

  function num(v: string) {
    const n = Number(v.replace(/,/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => (editing ? setEditing(false) : router.back())}>‹</button>
        <h1 className="h1">{plan.stockName}</h1>
        {editing ? <span /> : (
          <button className="skip" type="button" onClick={() => setAskDelete(true)}>삭제</button>
        )}
      </div>
      <div className="scroll">
        {editing ? (
          <>
            <p className="sub">
              {plan.stockName} · {plan.stockCode} · {plan.market}
            </p>
            {overseas ? (
              <p className="overseas-hint">해외 종목은 가격을 달러(USD)로 입력하고, 소수점도 쓸 수 있어요.</p>
            ) : null}
            <div className="field" style={{ marginTop: 16 }}>
              <label>희망 매수가 ({unit}, 선택)</label>
              <input inputMode="decimal" value={targetBuy} onChange={(e) => setTargetBuy(e.target.value)} placeholder={overseas ? "0.00" : "0"} />
            </div>
            <div className="field">
              <label className="danger">손절가 ({unit}, 선택)</label>
              <input inputMode="decimal" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder={overseas ? "0.00" : "0"} />
            </div>
            <div className="field">
              <label>목표가 ({unit}, 선택)</label>
              <input inputMode="decimal" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder={overseas ? "0.00" : "0"} />
            </div>
            <div className="field">
              <label>메모 (선택)</label>
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="이 종목을 보는 이유" />
            </div>
          </>
        ) : (
          <>
            <div className="card">
              <dl className="detail-kv">
                <dt>종목</dt><dd>{plan.stockName} ({plan.stockCode})</dd>
                <dt>시장</dt><dd>{plan.market}</dd>
                <dt>희망 매수가</dt><dd>{plan.targetBuy != null ? formatPrice(plan.targetBuy, plan.market) : "-"}</dd>
                <dt>손절가</dt><dd>{plan.stopLoss != null ? formatPrice(plan.stopLoss, plan.market) : "-"}</dd>
                <dt>목표가</dt><dd>{plan.takeProfit != null ? formatPrice(plan.takeProfit, plan.market) : "-"}</dd>
                <dt>메모</dt><dd>{plan.memo || "-"}</dd>
              </dl>
            </div>
            <div className="section-head"><h2>연결된 기록</h2></div>
            {linked.length === 0 ? <p className="sub">아직 이 계획과 연결된 매매가 없어요.</p> : linked.map((t) => (
              <button key={t.id} className="trade-row" type="button" onClick={() => router.push(`/records/${t.id}`)}>
                <div>
                  <div className="name">{t.tradedAt}</div>
                  <div className="meta">{t.side === "buy" ? "매수" : "매도"} · {formatPrice(t.price, t.market)}</div>
                </div>
              </button>
            ))}
          </>
        )}
      </div>
      {editing ? (
        <div className="footer-cta">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              updatePlan(plan.id, {
                targetBuy: num(targetBuy),
                stopLoss: num(stopLoss),
                takeProfit: num(takeProfit),
                memo,
              });
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
          body="삭제한 계획은 되돌릴 수 없어요. 이미 연결된 매매 기록은 그대로 남습니다."
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
