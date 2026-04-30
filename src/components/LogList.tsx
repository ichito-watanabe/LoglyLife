import { useEffect, useState } from "react";
import { getDb } from "../db";
import { activityLogs, activityLogCategories, categories } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { LogEditModal } from "./LogEditModal";

type Log = {
  id: number;
  date: string;
  durationMinutes: number | null;
  memo: string | null;
  mood: number | null;
  tags: string[];
  categoryIds: number[];
};

type EditingLog = {
  id: number;
  date: string;
  durationMinutes: number | null;
  memo: string | null;
  mood: number | null;
  categoryIds: number[];
};

export function LogList({ refreshKey }: { refreshKey: number }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [editingLog, setEditingLog] = useState<EditingLog | null>(null);

  async function loadLogs() {
    const db = getDb();
    const [logRows, catRows] = await Promise.all([
      db.select({
        id: activityLogs.id,
        date: activityLogs.date,
        durationMinutes: activityLogs.durationMinutes,
        memo: activityLogs.memo,
        mood: activityLogs.mood,
      }).from(activityLogs).orderBy(desc(activityLogs.date)),

      db.select({
        logId: activityLogCategories.logId,
        categoryId: activityLogCategories.categoryId,
        categoryName: categories.name,
        parentId: categories.parentId,
      }).from(activityLogCategories)
        .innerJoin(categories, eq(categories.id, activityLogCategories.categoryId)),
    ]);

    type CatInfo = { id: number; name: string; parentId: number | null };
    const catInfoByLog = new Map<number, CatInfo[]>();
    for (const row of catRows) {
      if (!catInfoByLog.has(row.logId)) catInfoByLog.set(row.logId, []);
      catInfoByLog.get(row.logId)!.push({ id: row.categoryId, name: row.categoryName, parentId: row.parentId });
    }
    setLogs(logRows.map((log) => {
      const cats = catInfoByLog.get(log.id) ?? [];
      const leafCats = cats.filter((c) => !cats.some((other) => other.parentId === c.id));
      return {
        ...log,
        tags: leafCats.map((c) => c.name),
        categoryIds: cats.map((c) => c.id),
      };
    }));
  }

  useEffect(() => { loadLogs(); }, [refreshKey]);

  async function handleDelete(logId: number) {
    const db = getDb();
    await db.delete(activityLogCategories).where(eq(activityLogCategories.logId, logId));
    await db.delete(activityLogs).where(eq(activityLogs.id, logId));
    await loadLogs();
  }

  if (logs.length === 0) return <p>ログがまだありません</p>;

  return (
    <section>
      <table>
        <thead>
          <tr>
            <th>日付</th>
            <th>タグ</th>
            <th>気分</th>
            <th>時間</th>
            <th>メモ</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.date}</td>
              <td>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {log.tags.map((tag) => (
                    <span key={tag} style={{ background: "#f1f5f9", borderRadius: "4px", padding: "1px 6px", fontSize: "0.85em" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td>{log.mood != null ? ["","最悪","悪い","普通","良い","最高"][log.mood] : "-"} </td>
              <td>{log.durationMinutes != null ? `${log.durationMinutes}分` : "—"}</td>
              <td>{log.memo ?? "—"}</td>
              <td>
                <button onClick={() => setEditingLog(log)} style={{ cursor: "pointer" }}>
                  編集
                </button>
              </td>
              <td>
                <button onClick={() => handleDelete(log.id)} style={{ color: "red", cursor: "pointer" }}>
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingLog && (
        <LogEditModal
          log={editingLog}
          onSaved={loadLogs}
          onClose={() => setEditingLog(null)}
        />
      )}
    </section>
  );
}
