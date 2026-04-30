import { useState, useEffect } from "react";
import { getDb } from "../db";
import { categories, activityLogs, activityLogCategories } from "../db/schema";
import { eq } from "drizzle-orm";
import { Category, buildPath, getAncestorIds } from "../db/categoryUtils";
import { CategoryTree } from "./CategoryTree";

type Log = {
  id: number;
  date: string;
  durationMinutes: number | null;
  memo: string | null;
  mood: number | null;
  categoryIds: number[];
};

type Props = {
  log: Log;
  onSaved: () => void;
  onClose: () => void;
};

export function LogEditModal({ log, onSaved, onClose }: Props) {
  const [date, setDate] = useState(log.date);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
  const [duration, setDuration] = useState(log.durationMinutes != null ? String(log.durationMinutes) : "");
  const [memo, setMemo] = useState(log.memo ?? "");
  const [mood, setMood] = useState(log.mood ?? 5);
  const [categoryList, setCategoryList] = useState<Category[]>([]);

  useEffect(() => {
    const db = getDb();
    db.select({ id: categories.id, name: categories.name, parentId: categories.parentId })
      .from(categories)
      .then((list) => {
        setCategoryList(list);
        const leafIds = log.categoryIds.filter((id) =>
          !log.categoryIds.some((otherId) => {
            const other = list.find((c) => c.id === otherId);
            return other?.parentId === id;
          })
        );
        setSelectedCategoryIds(new Set(leafIds));
      });
  }, []);

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (selectedCategoryIds.size === 0) return;
    const db = getDb();

    await db.update(activityLogs)
      .set({ date, durationMinutes: duration ? Number(duration) : null, memo: memo || null, mood })
      .where(eq(activityLogs.id, log.id));

    await db.delete(activityLogCategories).where(eq(activityLogCategories.logId, log.id));

    const allCategoryIds = new Set<number>();
    for (const catId of selectedCategoryIds) {
      for (const id of getAncestorIds(categoryList, catId)) {
        allCategoryIds.add(id);
      }
    }
    for (const catId of allCategoryIds) {
      await db.insert(activityLogCategories).values({ logId: log.id, categoryId: catId });
    }

    onSaved();
    onClose();
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100
    }}>
      <div style={{
        background: "linear-gradient(180deg, #231200 0%, #1a0d00 100%)",
        border: "2px solid #5a3800",
        boxShadow: "0 8px 32px rgba(0,0,0,0.8), inset 0 1px 0 rgba(200,150,50,0.1)",
        padding: "20px",
        minWidth: "340px",
        maxWidth: "440px",
        width: "90vw",
        fontFamily: "'DotGothic16', monospace",
        color: "#d8b880",
      }}>
        <h2 style={{ fontSize: 13, color: "#c8902a", letterSpacing: 2, marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #4a2800" }}>
          ログを編集
        </h2>
        <form onSubmit={handleSave} className="machine-screen-inner" style={{ padding: 0, height: "auto", overflow: "visible" }}>
          <div>
            <label>日付</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label>カテゴリ</label>
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
            <label>作業時間（分）</label>
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" />
          </div>
          <div>
            <label>メモ</label>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
          </div>
          <div>
            <label>気分（1〜10）: {mood}</label>
            <input
              type="range"
              min="1"
              max="10"
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              className="hw-slider"
              style={{ marginBottom: 8 }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="submit">保存</button>
            <button type="button" onClick={onClose}>キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  );
}
