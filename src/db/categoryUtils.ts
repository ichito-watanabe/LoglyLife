export type Category = { id: number; name: string; parentId: number | null };

export function buildPath(all: Category[], id: number): string {
  const map = new Map(all.map((c) => [c.id, c]));
  const parts: string[] = [];
  let cur = map.get(id);
  while (cur) {
    parts.unshift(cur.name);
    cur = cur.parentId != null ? map.get(cur.parentId) : undefined;
  }
  return parts.join(" > ");
}

// 指定IDのカテゴリ＋すべての祖先IDを返す（ルートから順）
export function getAncestorIds(all: Category[], id: number): number[] {
  const map = new Map(all.map((c) => [c.id, c]));
  const ids: number[] = [];
  let cur = map.get(id);
  while (cur) {
    ids.unshift(cur.id);
    cur = cur.parentId != null ? map.get(cur.parentId) : undefined;
  }
  return ids;
}
