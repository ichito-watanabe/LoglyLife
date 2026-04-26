import { useState, useEffect } from "react";
import { getDb } from "../db";
import { categories } from "../db/schema";
import { Category, buildPath } from "../db/categoryUtils";
import { CategoryTree } from "./CategoryTree";

export function CategoryForm({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");

  async function loadCategories() {
    const db = getDb();
    const rows = await db
      .select({ id: categories.id, name: categories.name, parentId: categories.parentId })
      .from(categories);
    setAllCategories(rows);
  }

  useEffect(() => { loadCategories(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const trimmed = name.trim();
    const duplicate = allCategories.some(
      (c) => c.name === trimmed && c.parentId === parentId
    );
    if (duplicate) {
      setError(`「${trimmed}」はすでに存在しています`);
      return;
    }
    setError("");
    const db = getDb();
    await db.insert(categories).values({ name: trimmed, parentId });
    setName("");
    await loadCategories();
    onAdded();
  }

  const addLocation = parentId === null
    ? "トップレベル"
    : buildPath(allCategories, parentId);

  return (
    <form onSubmit={handleSubmit} style={{ padding: "8px" }}>
      <div style={{ marginBottom: "4px", fontSize: "0.85em", color: "#555" }}>
        シングルクリック: 追加先を選択　／　ダブルクリック: 中に入る
      </div>
      <CategoryTree
        allCategories={allCategories}
        selectedIds={parentId !== null ? new Set([parentId]) : new Set()}
        onSelect={setParentId}
      />
      <div style={{ marginTop: "8px", fontSize: "0.85em", color: "#555" }}>
        追加先: {addLocation}
      </div>
      {error && <div style={{ color: "red", fontSize: "0.85em", marginTop: "4px" }}>{error}</div>}
      <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="カテゴリ名"
        />
        <button type="submit">追加</button>
      </div>
    </form>
  );
}
