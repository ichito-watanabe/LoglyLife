import { useState, useEffect } from "react";
import { getDb, insertActivityLog } from "../db";
import { categories, activityLogCategories } from "../db/schema";
import { Category, buildPath, getAncestorIds } from "../db/categoryUtils";
import { CategoryTree } from "./CategoryTree";

export function LogForm({ onAdded, categoryRefreshKey }: { onAdded: () => void; categoryRefreshKey: number }) {
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
  const [duration, setDuration] = useState(0);
  const [memo, setMemo] = useState("");
  const [mood, setMood] = useState(5)
  const [message, setMessage] = useState("");

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedCategoryIds.size === 0) return;
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

    setMessage("登録しました！");
    onAdded();
    setSelectedCategoryIds(new Set());
    setDuration(0);
    setMemo("");
    setMood(5);
  }

  return (
    <main>
      <form onSubmit={handleSubmit}>
        <div>
          <label>日付</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label>カテゴリ（最大3つ・シングルクリックで選択・ダブルクリックで展開）</label>
          <CategoryTree
            allCategories={categoryList}
            selectedIds={selectedCategoryIds}
            onSelect={toggleCategory}
          />
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
        <div>
          <label>作業時間</label>
          <div className="duration-display">{duration > 0 ? `${duration} 分` : "-- 分"}</div>
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
            <button
              type="button"
              className="duration-reset-btn"
              onClick={() => setDuration(0)}
            >
              RST
            </button>
          </div>
        </div>
        <div>
          <label>メモ</label>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>
        <div>
          <label>気分</label>
          <div className="hw-slider-wrap">
            <div className="hw-slider-labels">
              <span>最低</span>
              <span>普通</span>
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
            <div className="hw-slider-value">{mood} / 10</div>
          </div>
        </div>
        <button type="submit">登録する</button>
      </form>
      {message && <p>{message}</p>}
    </main>
  );
}
