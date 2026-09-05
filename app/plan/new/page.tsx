"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { StockSearch } from "@/components/StockSearch";
import { isOverseas, priceUnit } from "@/lib/markets";
import { useStore } from "@/lib/store";
import type { Stock } from "@/lib/types";

export default function NewPlanPage() {
  const router = useRouter();
  const { addPlan } = useStore();
  const [stock, setStock] = useState<Stock | null>(null);
  const [targetBuy, setTargetBuy] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [memo, setMemo] = useState("");
  const overseas = stock ? isOverseas(stock.market) : false;
  const unit = stock ? priceUnit(stock.market) : "원";

  function num(v: string) {
    const n = Number(v.replace(/,/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => (stock ? setStock(null) : router.back())}>
          ‹
        </button>
        <h1 className="h1">{overseas ? "해외 종목 계획" : "계획 등록"}</h1>
        <span />
      </div>
      <div className="scroll">
        {!stock ? (
          <>
            <div className="step-kicker">계획 등록</div>
            <h1 className="step-title">종목 검색</h1>
            <StockSearch heading="계획을 남길 종목을 먼저 선택해 주세요." onPick={setStock} />
          </>
        ) : (
          <>
            <p className="sub">
              {stock.name} · {stock.code} · {stock.marketName}
            </p>
            {overseas ? (
              <p className="overseas-hint">해외 종목은 가격을 달러(USD)로 입력하고, 소수점도 쓸 수 있어요.</p>
            ) : null}
            <div className="field" style={{ marginTop: 16 }}>
              <label>희망 매수가 ({unit}, 선택)</label>
              <input
                inputMode="decimal"
                value={targetBuy}
                onChange={(e) => setTargetBuy(e.target.value)}
                placeholder={overseas ? "0.00" : "0"}
              />
            </div>
            <div className="field">
              <label className="danger">손절가 ({unit}, 선택)</label>
              <input
                inputMode="decimal"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder={overseas ? "0.00" : "0"}
              />
            </div>
            <div className="field">
              <label>목표가 ({unit}, 선택)</label>
              <input
                inputMode="decimal"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder={overseas ? "0.00" : "0"}
              />
            </div>
            <div className="field">
              <label>메모 (선택)</label>
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="이 종목을 보는 이유" />
            </div>
          </>
        )}
      </div>
      {stock ? (
        <div className="footer-cta">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              addPlan({
                stockCode: stock.code,
                stockName: stock.name,
                market: stock.market,
                targetBuy: num(targetBuy),
                stopLoss: num(stopLoss),
                takeProfit: num(takeProfit),
                memo,
              });
              router.replace("/plan");
            }}
          >
            계획 저장
          </button>
        </div>
      ) : null}
    </PhoneShell>
  );
}
