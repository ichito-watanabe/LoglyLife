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
  categoryIds: number[];
};

type Props = {
  log: Log;
  onSaved: () => void;
  onClose: () => void;
};

export function LogEditModal({ log, onSaved, onClose }: Props) {
  const [date, setDate] = useState(log.date);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set(log.categoryIds));
  const [duration, setDuration] = useState(log.durationMinutes != null ? String(log.durationMinutes) : "");
  const [memo, setMemo] = useState(log.memo ?? "");
  const [categoryList, setCategoryList] = useState<Category[]>([]);

  useEffect(() => {
    const db = getDb();
    db.select({ id: categories.id, name: categories.name, parentId: categories.parentId })
      .from(categories)
      .then(setCategoryList);
  }, []);

  function toggleCategory(id: number) {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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
    if (selectedCategoryIds.size === 0) return;
    const db = getDb();

    await db.update(activityLogs)
      .set({ date, durationMinutes: duration ? Number(duration) : null, memo: memo || null })
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "white", padding: "24px", borderRadius: "8px", minWidth: "320px" }}>
        <h2>ログを編集</h2>
        <form onSubmit={handleSave}>
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                {[...selectedCategoryIds].map((id) => (
                  <span key={id} style={{ background: "#dbeafe", borderRadius: "4px", padding: "2px 8px", fontSize: "0.85em" }}>
                    {buildPath(categoryList, id)}
                    <span onClick={() => removeCategory(id)} style={{ cursor: "pointer", marginLeft: "6px", color: "#999" }}>×</span>
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
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <button type="submit">保存</button>
            <button type="button" onClick={onClose}>キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  );
}
