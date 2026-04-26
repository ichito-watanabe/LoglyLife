import { useState, useEffect } from "react";
import { getDb } from "../db";
import { categories, activityLogs, activityLogCategories } from "../db/schema";
import { Category, buildPath, getAncestorIds } from "../db/categoryUtils";
import { CategoryTree } from "./CategoryTree";

export function LogForm({ onAdded, categoryRefreshKey }: { onAdded: () => void; categoryRefreshKey: number }) {
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());
  const [duration, setDuration] = useState("");
  const [memo, setMemo] = useState("");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedCategoryIds.size === 0) return;

    const db = getDb();
    const [log] = await db.insert(activityLogs).values({
      date,
      durationMinutes: duration ? Number(duration) : null,
      memo: memo || null,
    }).returning({ id: activityLogs.id });

    const allCategoryIds = new Set<number>();
    for (const catId of selectedCategoryIds) {
      for (const id of getAncestorIds(categoryList, catId)) {
        allCategoryIds.add(id);
      }
    }

    for (const catId of allCategoryIds) {
      await db.insert(activityLogCategories).values({ logId: log.id, categoryId: catId });
    }

    setMessage("登録しました！");
    onAdded();
    setSelectedCategoryIds(new Set());
    setDuration("");
    setMemo("");
  }

  return (
    <main>
      <form onSubmit={handleSubmit}>
        <div>
          <label>日付</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label>カテゴリ（シングルクリックで選択・ダブルクリックで展開）</label>
          <CategoryTree
            allCategories={categoryList}
            selectedIds={selectedCategoryIds}
            onSelect={toggleCategory}
          />
          {selectedCategoryIds.size > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
              {[...selectedCategoryIds].map((id) => (
                <span
                  key={id}
                  style={{ background: "#dbeafe", borderRadius: "4px", padding: "2px 8px", fontSize: "0.85em" }}
                >
                  {buildPath(categoryList, id)}
                  <span
                    onClick={() => removeCategory(id)}
                    style={{ cursor: "pointer", marginLeft: "6px", color: "#999" }}
                  >
                    ×
                  </span>
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
        <button type="submit">登録する</button>
      </form>
      {message && <p>{message}</p>}
    </main>
  );
}
