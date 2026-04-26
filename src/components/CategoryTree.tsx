import { useState, useRef } from "react";
import { Category } from "../db/categoryUtils";

type Props = {
  allCategories: Category[];
  selectedIds?: Set<number>;
  onSelect?: (id: number) => void;
};

export function CategoryTree({ allCategories, selectedIds, onSelect }: Props) {
  const [viewParentId, setViewParentId] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visibleItems = allCategories.filter((c) => c.parentId === viewParentId);

  function getBreadcrumb(): string {
    const path: string[] = [];
    let id: number | null = viewParentId;
    while (id !== null) {
      const cat = allCategories.find((c) => c.id === id);
      if (!cat) break;
      path.unshift(cat.name);
      id = cat.parentId;
    }
    return path.length === 0 ? "トップ" : path.join(" > ");
  }

  function goUp() {
    const current = allCategories.find((c) => c.id === viewParentId);
    setViewParentId(current?.parentId ?? null);
  }

  function handleClick(id: number) {
    if (timerRef.current) {
      // 250ms以内に2回 = ダブルクリック → 中に入る
      clearTimeout(timerRef.current);
      timerRef.current = null;
      setViewParentId(id);
      onSelect?.(id);
    } else {
      // 1回目 → 250ms待ってシングルクリックと確定したら選択
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        onSelect?.(id);
      }, 250);
    }
  }

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: "4px", padding: "8px", minWidth: "200px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", borderBottom: "1px solid #eee", paddingBottom: "6px" }}>
        {viewParentId !== null && (
          <button type="button" onClick={goUp} style={{ padding: "2px 8px", cursor: "pointer" }}>← 戻る</button>
        )}
        <span style={{ fontSize: "0.85em", color: "#666" }}>{getBreadcrumb()}</span>
      </div>

      {visibleItems.map((cat) => {
        const hasChildren = allCategories.some((c) => c.parentId === cat.id);
        const isSelected = selectedIds?.has(cat.id) ?? false;
        return (
          <div
            key={cat.id}
            onClick={() => handleClick(cat.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 6px",
              backgroundColor: isSelected ? "#dbeafe" : "transparent",
              borderRadius: "4px",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <span style={{ fontWeight: isSelected ? "bold" : "normal" }}>
              {isSelected && "✓ "}{cat.name}
            </span>
            {hasChildren && (
              <span style={{ fontSize: "0.7em", color: "#bbb" }}>ダブルクリックで展開</span>
            )}
          </div>
        );
      })}

      {visibleItems.length === 0 && (
        <div style={{ color: "#999", fontSize: "0.85em", padding: "4px 6px" }}>子カテゴリなし</div>
      )}
    </div>
  );
}
