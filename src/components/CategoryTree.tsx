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
      clearTimeout(timerRef.current);
      timerRef.current = null;
      setViewParentId(id);
      onSelect?.(id);
    } else {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        onSelect?.(id);
      }, 250);
    }
  }

  return (
    <div className="cat-tree">
      <div className="cat-tree-header">
        {viewParentId !== null && (
          <button type="button" onClick={goUp} className="cat-tree-back">← 戻る</button>
        )}
        <span className="cat-tree-breadcrumb">{getBreadcrumb()}</span>
      </div>

      {visibleItems.map((cat) => {
        const hasChildren = allCategories.some((c) => c.parentId === cat.id);
        const isSelected = selectedIds?.has(cat.id) ?? false;
        return (
          <div
            key={cat.id}
            onClick={() => handleClick(cat.id)}
            className={`cat-tree-item ${isSelected ? "cat-tree-item--selected" : ""}`}
          >
            <span className="cat-tree-name">
              {isSelected && "✓ "}{cat.name}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {hasChildren && <span className="cat-tree-hint">›</span>}
              <div className="cat-tree-knob" />
            </div>
          </div>
        );
      })}

      {visibleItems.length === 0 && (
        <div className="cat-tree-empty">子カテゴリなし</div>
      )}
    </div>
  );
}
