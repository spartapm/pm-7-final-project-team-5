"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { reasonGroups, searchReasons, toPick, type ReasonGroup } from "@/lib/categories";
import type { CategoryPick } from "@/lib/types";

function pickId(item: CategoryPick) {
  return item.meta || item.label;
}

export function ReasonPicker({
  selected,
  onChange,
  onComplete,
  completeLabel = "완료",
}: {
  selected: CategoryPick[];
  onChange: (next: CategoryPick[]) => void;
  onComplete: () => void;
  completeLabel?: string;
}) {
  const groups = reasonGroups();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState<ReasonGroup | null>(null);
  const [sheetFull, setSheetFull] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const drag = useRef<{ y: number; full: boolean } | null>(null);
  const maxed = selected.length >= 3;
  const result = useMemo(() => searchReasons(query), [query]);
  const canSearch = query.replace(/\s/g, "").length >= 1;

  useEffect(() => {
    if (!searching) return;
    const t = window.setTimeout(() => searchRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [searching]);

  useEffect(() => {
    if (!searching) return;
    const onFocus = () => setKbOpen(true);
    const onBlur = () => setKbOpen(false);
    const el = searchRef.current;
    el?.addEventListener("focus", onFocus);
    el?.addEventListener("blur", onBlur);
    return () => {
      el?.removeEventListener("focus", onFocus);
      el?.removeEventListener("blur", onBlur);
    };
  }, [searching]);

  function toggle(item: CategoryPick) {
    const exists = selected.some((r) => pickId(r) === pickId(item));
    if (!exists && maxed) return;
    onChange(exists ? selected.filter((r) => pickId(r) !== pickId(item)) : [...selected, item]);
  }

  function closeSearch() {
    setQuery("");
    setSearching(false);
    setKbOpen(false);
  }

  const catCount = result.categories.length;
  const itemCount = result.items.length;
  const summary =
    catCount && itemCount
      ? `'${query.trim()}'로 카테고리 ${catCount}개 · 항목 ${itemCount}개를 찾았어요`
      : catCount
        ? `'${query.trim()}'로 카테고리 ${catCount}개를 찾았어요`
        : itemCount
          ? `'${query.trim()}'로 항목 ${itemCount}개를 찾았어요`
          : "";

  return (
    <>
      {searching ? (
        <div className="reason-search-head">
          <div className="reason-search-box">
            <span aria-hidden>⌕</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="키워드로 찾아보세요"
              aria-label="매매 이유 검색"
            />
          </div>
          <button className="reason-cancel" type="button" onClick={closeSearch}>
            취소
          </button>
        </div>
      ) : (
        <>
          <h1 className="step-title">매매 이유 선택</h1>
          <p className="sub">최대 3개까지 고를 수 있어요</p>
          <button className="reason-search-entry" type="button" onClick={() => setSearching(true)}>
            <span aria-hidden>⌕</span>
            키워드로 찾아보세요
          </button>
        </>
      )}

      <div className={`reason-scroll ${searching ? "searching" : ""}`}>
        {searching ? (
          !canSearch ? (
            <p className="reason-empty">검색어를 입력하면 카테고리와 항목을 찾아드려요</p>
          ) : catCount + itemCount === 0 ? (
            <div className="reason-empty">
              <p>검색 결과가 없어요</p>
              <button className="btn btn-ghost" type="button" onClick={closeSearch}>
                전체 카테고리 둘러보기
              </button>
            </div>
          ) : (
            <>
              <p className="reason-summary">{summary}</p>
              {catCount > 0 ? (
                <section>
                  <h2 className="reason-sec">카테고리에서 찾았어요</h2>
                  {result.categories.map(({ group }) => (
                    <GroupCard
                      key={group.group}
                      group={group}
                      selected={selected}
                      onOpen={() => {
                        setSheet(group);
                        setSheetFull(false);
                      }}
                    />
                  ))}
                </section>
              ) : null}
              {itemCount > 0 ? (
                <section>
                  <h2 className="reason-sec">항목에서 찾았어요</h2>
                  {result.items.map(({ item }) => {
                    const pick = toPick(item);
                    const on = selected.some((r) => pickId(r) === pickId(pick));
                    return (
                      <ItemCard
                        key={item.meta}
                        title={item.label}
                        subtitle={item.subtitle || ""}
                        on={on}
                        dim={maxed && !on}
                        onClick={() => toggle(pick)}
                      />
                    );
                  })}
                </section>
              ) : null}
            </>
          )
        ) : (
          groups.map((group) => (
            <GroupCard
              key={group.group}
              group={group}
              selected={selected}
              onOpen={() => {
                setSheet(group);
                setSheetFull(false);
              }}
            />
          ))
        )}
      </div>

      {!kbOpen ? (
        <SelectBar selected={selected} onRemove={toggle} disabled={selected.length === 0} onComplete={onComplete} completeLabel={completeLabel} />
      ) : null}

      {sheet ? (
        <div
          className="sheet-back"
          onClick={() => setSheet(null)}
        >
          <div
            className={`reason-sheet ${sheetFull ? "full" : ""}`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => {
              drag.current = { y: e.clientY, full: sheetFull };
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const dy = e.clientY - drag.current.y;
              if (!drag.current.full && dy < -24) setSheetFull(true);
              if (drag.current.full && dy > 24) setSheetFull(false);
            }}
            onPointerUp={(e) => {
              if (!drag.current) return;
              const dy = e.clientY - drag.current.y;
              if (!drag.current.full && dy > 48) setSheet(null);
              drag.current = null;
            }}
          >
            <i className="sheet-grab" />
            <div className="sheet-head">
              <b>{sheet.group}</b>
              <button type="button" onClick={() => setSheet(null)} aria-label="닫기">
                ✕
              </button>
            </div>
            <div className="sheet-list">
              {sheet.items.map((item) => {
                const pick = toPick(item);
                const on = selected.some((r) => pickId(r) === pickId(pick));
                return (
                  <ItemCard
                    key={item.meta}
                    title={item.label}
                    subtitle={item.subtitle || ""}
                    on={on}
                    dim={maxed && !on}
                    onClick={() => toggle(pick)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function GroupCard({
  group,
  selected,
  onOpen,
}: {
  group: ReasonGroup;
  selected: CategoryPick[];
  onOpen: () => void;
}) {
  const n = selected.filter((r) => r.group === group.group).length;
  return (
    <button className={`reason-group ${n ? "has" : ""}`} type="button" onClick={onOpen}>
      <span className="reason-group-title">{group.group}</span>
      <span className="reason-group-sub">{group.subtitle}</span>
      <span className="reason-group-meta">
        {group.items.length}개 항목{n ? ` · ${n}개 선택` : ""}
      </span>
    </button>
  );
}

function ItemCard({
  title,
  subtitle,
  on,
  dim,
  onClick,
}: {
  title: string;
  subtitle: string;
  on: boolean;
  dim: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`reason-item ${on ? "on" : ""} ${dim ? "dim" : ""}`} disabled={dim} onClick={onClick}>
      <b>{title}</b>
      <span>{subtitle}</span>
    </button>
  );
}

export function MoodPicker({
  items,
  selected,
  onChange,
}: {
  items: ReturnType<typeof import("@/lib/categories").moodOptions>;
  selected: CategoryPick[];
  onChange: (next: CategoryPick[]) => void;
}) {
  const maxed = selected.length >= 2;
  function toggle(item: CategoryPick) {
    const exists = selected.some((r) => (r.meta || r.label) === (item.meta || item.label));
    if (!exists && maxed) return;
    onChange(exists ? selected.filter((r) => (r.meta || r.label) !== (item.meta || item.label)) : [...selected, item]);
  }
  return (
    <div className="mood-list reason-moods">
      {items.map((m) => {
        const pick = toPick(m);
        const on = selected.some((x) => (x.meta || x.label) === pick.meta);
        return (
          <ItemCard
            key={m.meta}
            title={m.label}
            subtitle={m.subtitle || ""}
            on={on}
            dim={maxed && !on}
            onClick={() => toggle(pick)}
          />
        );
      })}
    </div>
  );
}

export function SelectBar({
  selected,
  onRemove,
  disabled,
  onComplete,
  completeLabel,
}: {
  selected: CategoryPick[];
  onRemove: (item: CategoryPick) => void;
  disabled: boolean;
  onComplete: () => void;
  completeLabel: string;
}) {
  return (
    <div className="reason-bar">
      <div className="reason-chips" aria-label="선택한 항목">
        {selected.map((item) => (
          <span key={item.meta || item.label} className="reason-chip">
            <em>{item.label}</em>
            <button type="button" aria-label={`${item.label} 삭제`} onClick={() => onRemove(item)}>
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="reason-bar-row">
        <span className="reason-count">{selected.length}개 선택</span>
        <button className="btn btn-primary reason-done" type="button" disabled={disabled} onClick={onComplete}>
          {completeLabel}
        </button>
      </div>
    </div>
  );
}
