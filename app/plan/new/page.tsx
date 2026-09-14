"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackChevron } from "@/components/icons";
import { ChoiceSheet, PhoneShell } from "@/components/ui";
import { StockSearch } from "@/components/StockSearch";
import { isOverseas, sameStockCode } from "@/lib/markets";
import { displayPriceValue, parseNum, sanitizePrice } from "@/lib/money";
import { NumPad, PadField } from "@/components/NumPad";
import { findPlan } from "@/lib/plans";
import { findStock } from "@/lib/stocks";
import { useStore } from "@/lib/store";
import { ensurePlanSession, planSessionId, track } from "@/lib/analytics";
import type { Side, Stock } from "@/lib/types";
import { Suspense } from "react";

function NewPlanInner() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("return");
  const lockSide = params.get("side") === "sell" ? "sell" : params.get("side") === "buy" ? "buy" : null;
  const { plans, addPlan, updatePlan, showToast, attachPlanToTrade } = useStore();
  const [stock, setStock] = useState<Stock | null>(null);
  const [side, setSide] = useState<Side | null>(lockSide);
  const [askType, setAskType] = useState(false);
  const [askDup, setAskDup] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [buyMin, setBuyMin] = useState("0");
  const [buyMax, setBuyMax] = useState("0");
  const [stopLoss, setStopLoss] = useState("0");
  const [takeProfit, setTakeProfit] = useState("0");
  const [pad, setPad] = useState<"buyMin" | "buyMax" | "stopLoss" | "takeProfit" | null>(null);
  const lockedOnce = useRef(false);
  const overseas = stock ? isOverseas(stock.market) : false;

  useEffect(() => {
    ensurePlanSession("direct");
  }, []);

  useEffect(() => {
    const code = params.get("code");
    const market = params.get("market") || undefined;
    const name = params.get("name") || undefined;
    if (!code || stock) return;
    const fromList = findStock(code, market);
    if (fromList) {
      setStock(fromList);
      return;
    }
    const fromPlan =
      plans.find((p) => sameStockCode(p.stockCode, code) && (!market || p.market === market)) ??
      plans.find((p) => sameStockCode(p.stockCode, code));
    if (fromPlan) {
      const listed = findStock(fromPlan.stockCode, fromPlan.market);
      setStock(
        listed || {
          code: fromPlan.stockCode,
          name: fromPlan.stockName,
          market: fromPlan.market,
          marketName: fromPlan.market,
        }
      );
      return;
    }
    if (name) {
      setStock({ code, name, market: market || "KOSPI", marketName: market || "KOSPI" });
    }
  }, [params, stock, plans]);

  useEffect(() => {
    if (!stock || !lockSide || lockedOnce.current) return;
    lockedOnce.current = true;
    chooseSide(lockSide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stock, lockSide]);

  useEffect(() => {
    if (!stock || !lockSide || editingId) return;
    const found = findPlan(plans, stock.code, stock.market, lockSide);
    if (!found) return;
    setEditingId(found.id);
    setBuyMin(found.buyMin != null ? sanitizePrice(String(found.buyMin), stock.market) : "0");
    setBuyMax(found.buyMax != null ? sanitizePrice(String(found.buyMax), stock.market) : "0");
    setStopLoss(found.stopLoss != null ? sanitizePrice(String(found.stopLoss), stock.market) : "0");
    setTakeProfit(found.takeProfit != null ? sanitizePrice(String(found.takeProfit), stock.market) : "0");
    setAskDup(!returnTo);
    setAskType(false);
    setSide(lockSide);
  }, [plans, stock, lockSide, editingId, returnTo]);

  function chooseSide(next: Side, picked: Stock | null = stock) {
    if (!picked) return;
    const found = findPlan(plans, picked.code, picked.market, next);
    setSide(next);
    setAskType(false);
    if (found) {
      setEditingId(found.id);
      setBuyMin(found.buyMin != null ? sanitizePrice(String(found.buyMin), picked.market) : "0");
      setBuyMax(found.buyMax != null ? sanitizePrice(String(found.buyMax), picked.market) : "0");
      setStopLoss(found.stopLoss != null ? sanitizePrice(String(found.stopLoss), picked.market) : "0");
      setTakeProfit(found.takeProfit != null ? sanitizePrice(String(found.takeProfit), picked.market) : "0");
      setAskDup(!returnTo);
    } else {
      setAskDup(false);
      setEditingId(null);
    }
  }

  function pickStock(next: Stock) {
    setStock(next);
    setAskDup(false);
    setEditingId(null);
    if (lockSide) {
      chooseSide(lockSide, next);
      return;
    }
    setSide(null);
    setAskType(true);
  }

  function save() {
    if (!stock || !side) return;
    let piece: { buy?: { min: number; max: number }; sell?: { stopLoss: number; takeProfit: number } } | null = null;
    if (side === "buy") {
      const min = parseNum(buyMin);
      const max = parseNum(buyMax);
      if (!(min > 0) || !(max > 0) || min > max) {
        showToast("최소 희망가는 최대 희망가보다 작거나 같아야해요", "err");
        track("plan_save_error", {
          plan_session_id: planSessionId(),
          error_code: "validation_error",
          retryable: true,
        });
        return;
      }
      const payload = {
        side,
        stockCode: stock.code,
        stockName: stock.name,
        market: stock.market,
        buyMin: min,
        buyMax: max,
        stopLoss: null,
        takeProfit: null,
        memo: "",
      };
      if (editingId) updatePlan(editingId, payload);
      else addPlan(payload);
      piece = { buy: { min, max } };
    } else {
      const stop = parseNum(stopLoss);
      const take = parseNum(takeProfit);
      if (!(stop > 0) || !(take > 0) || take < stop) {
        showToast("손절가는 목표가보다 낮거나 같아야해요", "err");
        track("plan_save_error", {
          plan_session_id: planSessionId(),
          error_code: "validation_error",
          retryable: true,
        });
        return;
      }
      const payload = {
        side,
        stockCode: stock.code,
        stockName: stock.name,
        market: stock.market,
        buyMin: null,
        buyMax: null,
        stopLoss: stop,
        takeProfit: take,
        memo: "",
      };
      if (editingId) updatePlan(editingId, payload);
      else addPlan(payload);
      piece = { sell: { stopLoss: stop, takeProfit: take } };
    }
    const tradeId = returnTo?.startsWith("/records/") ? returnTo.slice("/records/".length).split("?")[0] : "";
    if (tradeId && piece) attachPlanToTrade(tradeId, piece);
    router.replace(returnTo || "/plan");
  }

  const formReady = Boolean(stock && side && !askDup);

  return (
    <PhoneShell>
      <div className="topbar">
        <button
          className="icon-btn"
          type="button"
          onClick={() => {
            if (returnTo) {
              router.replace(returnTo);
              return;
            }
            if (formReady) {
              setSide(lockSide);
              setAskType(false);
              setAskDup(false);
              setEditingId(null);
              return;
            }
            if (stock) {
              setStock(null);
              setAskType(false);
              setAskDup(false);
              setSide(lockSide);
              return;
            }
            router.back();
          }}
          aria-label="뒤로"
        >
          <BackChevron />
        </button>
        <h1 className="h1">{overseas ? "해외 종목 계획" : side === "sell" ? "매도 계획" : side === "buy" ? "매수 계획" : "계획 등록"}</h1>
        <span />
      </div>
      <div className="scroll">
        {!formReady ? (
          <>
            <div className="step-kicker">계획 등록</div>
            <h1 className="step-title">종목 검색</h1>
            <StockSearch
              emptyText="종목을 찾지 못했어요, 입력한 내용을 다시 확인해 주세요"
              selected={stock}
              onPick={pickStock}
            />
          </>
        ) : (
          <>
            <p className="sub">
              {stock!.name} · {stock!.code} · {stock!.marketName}
            </p>
            {side === "buy" ? (
              <>
                <PadField label="최소 희망가" value={displayPriceValue(buyMin, stock!.market)} align="right" onOpen={() => setPad("buyMin")} />
                <PadField label="최대 희망가" value={displayPriceValue(buyMax, stock!.market)} align="right" onOpen={() => setPad("buyMax")} />
              </>
            ) : (
              <>
                <PadField label="손절가" value={displayPriceValue(stopLoss, stock!.market)} align="right" onOpen={() => setPad("stopLoss")} />
                <PadField label="목표가" value={displayPriceValue(takeProfit, stock!.market)} align="right" onOpen={() => setPad("takeProfit")} />
              </>
            )}
          </>
        )}
      </div>
      {formReady ? (
        <div className="footer-cta">
          <button className="btn btn-primary" type="button" onClick={save}>
            저장
          </button>
        </div>
      ) : null}
      {askType ? (
        <ChoiceSheet
          title="어떤 매매 계획인가요?"
          left="매수"
          right="매도"
          onLeft={() => chooseSide("buy")}
          onRight={() => chooseSide("sell")}
          onClose={() => setAskType(false)}
        />
      ) : null}
      {askDup ? (
        <div className="modal-back">
          <div className="modal">
            <h3>이미 등록된 계획이 있어요. 계획을 수정하시겠어요?</h3>
            <button
              className="btn btn-primary"
              type="button"
              style={{ marginBottom: 8 }}
              onClick={() => setAskDup(false)}
            >
              네
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => { setAskDup(false); setSide(null); }}>
              아니오
            </button>
          </div>
        </div>
      ) : null}
      {pad && stock ? (
        <NumPad
          kind="price"
          value={pad === "buyMin" ? buyMin : pad === "buyMax" ? buyMax : pad === "stopLoss" ? stopLoss : takeProfit}
          market={stock.market}
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

export default function NewPlanPage() {
  return (
    <Suspense fallback={<div className="shell" />}>
      <NewPlanInner />
    </Suspense>
  );
}
