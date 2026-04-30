import { useState, useEffect, useRef } from "react";
import { getDb, insertActivityLog } from "../db";
import { categories, activityLogCategories } from "../db/schema";
import { Category, buildPath, getAncestorIds } from "../db/categoryUtils";
import { CategoryTree } from "./CategoryTree";
import { LogList } from "./LogList";
import { VUMeter } from "./VUMeter";

const MOOD_WORDS = ["", "最悪", "悪い", "少し悪", "やや低め", "普通", "まあ良い", "良い", "かなり良い", "とても良い", "最高"];

interface Props {
  categoryRefreshKey: number;
}

export function HomePage({ categoryRefreshKey }: Props) {
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
  const [duration, setDuration] = useState(0);
  const [memo, setMemo] = useState("");
  const [mood, setMood] = useState(5);
  const [message, setMessage] = useState("");
  const [logRefreshKey, setLogRefreshKey] = useState(0);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const pendingReset = useRef<(() => void) | null>(null);

  useEffect(() => {
    const db = getDb();
    db.select({ id: categories.id, name: categories.name, parentId: categories.parentId })
      .from(categories)
      .then(setCategoryList);
  }, [categoryRefreshKey]);

  function toggleCategory(id: number) {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  }

  function removeCategory(id: number) {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function handleSpinEnd() {
    pendingReset.current?.();
    pendingReset.current = null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedCategoryIds.size === 0 || isSubmitting) return;
    setIsSubmitting(true);

    const db = getDb();
    const logId = await insertActivityLog({
      date,
      durationMinutes: duration > 0 ? duration : null,
      memo: memo || null,
      mood,
    });

    const allCategoryIds = new Set<number>();
    for (const catId of selectedCategoryIds) {
      for (const id of getAncestorIds(categoryList, catId)) {
        allCategoryIds.add(id);
      }
    }
    for (const catId of allCategoryIds) {
      await db.insert(activityLogCategories).values({ logId, categoryId: catId });
    }

    // スピン後にフォームリセット実行（onSpinEnd コールバック経由）
    pendingReset.current = () => {
      setMessage("登録しました！");
      setTimeout(() => setMessage(""), 2000);
      setLogRefreshKey((k) => k + 1);
      setSelectedCategoryIds(new Set());
      setDuration(0);
      setMemo("");
      setMood(5);
      setIsSubmitting(false);
    };

    // スピン発動
    setSpinTrigger((k) => k + 1);
  }

  const formattedDate = date.replace(/-/g, " / ");
  const moodWord = MOOD_WORDS[mood] ?? "普通";

  return (
    <form className="home-layout" onSubmit={handleSubmit}>
      <div className="home-panels">

        {/* 左パネル */}
        <div className="panel-left">
          <div className="steam-panel date-panel">
            <span className="panel-title">日付</span>
            <div
              className="date-display"
              onClick={() => {
                try { dateInputRef.current?.showPicker(); } catch { /* no-op */ }
                dateInputRef.current?.focus();
              }}
            >
              {formattedDate}
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ position: "absolute", opacity: 0, top: 0, left: 0, width: "100%", height: "100%", cursor: "pointer" }}
              />
            </div>
          </div>

          <div className="steam-panel cat-panel">
            <span className="panel-title">カテゴリ（最大3つ・シングルクリックで選択・ダブルクリックで展開）</span>
            <div className="cat-scroll">
              <CategoryTree
                allCategories={categoryList}
                selectedIds={selectedCategoryIds}
                onSelect={toggleCategory}
              />
            </div>
            {selectedCategoryIds.size > 0 && (
              <div className="cat-selected-list">
                {[...selectedCategoryIds].map((id) => (
                  <span key={id} className="cat-selected-tag">
                    {buildPath(categoryList, id)}
                    <span onClick={() => removeCategory(id)} className="cat-selected-remove">×</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 中央パネル */}
        <div className="panel-center">
          <div className="steam-panel vu-panel">
            <VUMeter value={duration} spinTrigger={spinTrigger} onSpinEnd={handleSpinEnd} />
          </div>

          <div className="steam-panel time-panel">
            <div className="duration-btns">
              {[1, 5, 10, 30, 60].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="duration-add-btn"
                  onClick={() => setDuration((d) => d + n)}
                >
                  +{n}
                </button>
              ))}
              <button type="button" className="duration-reset-btn" onClick={() => setDuration(0)}>
                RST
              </button>
            </div>
          </div>

          <div className="steam-panel memo-panel">
            <textarea
              className="memo-textarea"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="メモ"
            />
          </div>

          {message ? (
            <div className="submit-message">{message}</div>
          ) : (
            <button
              type="submit"
              className="submit-btn"
              disabled={selectedCategoryIds.size === 0 || isSubmitting}
            >
              {isSubmitting ? "記録中…" : "登録する"}
            </button>
          )}
        </div>

        {/* 右パネル */}
        <div className="panel-right steam-panel">
          <LogList refreshKey={logRefreshKey} />
        </div>
      </div>

      {/* 気分ストリップ */}
      <div className="mood-strip">
        <TubeLamp />

        <div className="mood-slider-area">
          <div className="hw-slider-labels">
            <span>気分<br/>最低</span>
            <span className="mood-current-word">{moodWord}</span>
            <span>最高</span>
          </div>
          <input
            type="range"
            className="hw-slider"
            min="1"
            max="10"
            value={mood}
            onChange={(e) => setMood(Number(e.target.value))}
          />
          <div className="mood-value-display">{mood} / 10</div>
        </div>

        <div className="tune-knob-wrap">
          <span className="tune-label">TUNE</span>
          <div className="tune-knob" />
        </div>
      </div>
    </form>
  );
}

function TubeLamp() {
  return (
    <svg viewBox="0 0 70 100" style={{ width: 55, height: 88, flexShrink: 0 }}>
      <defs>
        <radialGradient id="lamp-glow" cx="50%" cy="58%" r="50%">
          <stop offset="0%" stopColor="#ffa030" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#ff6010" stopOpacity="0.45" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="lamp-glass" cx="36%" cy="28%" r="64%">
          <stop offset="0%" stopColor="rgba(255,220,140,0.18)" />
          <stop offset="100%" stopColor="rgba(180,120,50,0.04)" />
        </radialGradient>
      </defs>
      {/* Base */}
      <rect x="17" y="76" width="36" height="18" rx="3" fill="#4a3010" />
      <rect x="17" y="76" width="36" height="4" rx="1" fill="#6a5020" />
      {/* Pins */}
      <rect x="25" y="92" width="3.5" height="8" rx="1" fill="#3a2400" />
      <rect x="33" y="92" width="3.5" height="8" rx="1" fill="#3a2400" />
      <rect x="41" y="92" width="3.5" height="8" rx="1" fill="#3a2400" />
      {/* Neck */}
      <rect x="30" y="60" width="10" height="18" rx="1.5" fill="#3a2800" />
      {/* Glow */}
      <ellipse cx="35" cy="40" rx="26" ry="34" fill="url(#lamp-glow)" />
      {/* Glass */}
      <ellipse cx="35" cy="40" rx="26" ry="34" fill="url(#lamp-glass)" stroke="#c09050" strokeWidth="1.5" />
      {/* Filament */}
      <path d="M 30 66 Q 35 48 30 32 Q 35 24 40 32 Q 35 48 40 66" stroke="#ff9020" strokeWidth="1.3" fill="none" opacity="0.9" />
      <path d="M 32 66 Q 35 50 33 36 Q 35 30 37 36 Q 35 50 38 66" stroke="#ffc060" strokeWidth="0.7" fill="none" opacity="0.65" />
      {/* Highlight */}
      <ellipse cx="23" cy="24" rx="7" ry="12" fill="rgba(255,255,255,0.12)" />
    </svg>
  );
}
