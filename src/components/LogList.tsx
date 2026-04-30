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

const MOOD_SHORT = ["", "最悪", "悪い", "普通", "良い", "最高", "良い", "とても良", "素晴らしい", "完璧", "最高"];

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
      return { ...log, tags: leafCats.map((c) => c.name), categoryIds: cats.map((c) => c.id) };
    }));
  }

  useEffect(() => { loadLogs(); }, [refreshKey]);

  async function handleDelete(logId: number) {
    const db = getDb();
    await db.delete(activityLogCategories).where(eq(activityLogCategories.logId, logId));
    await db.delete(activityLogs).where(eq(activityLogs.id, logId));
    await loadLogs();
  }

  return (
    <div className="log-list-panel">
      <div className="log-list-header">
        <span style={{ flex: "0 0 68px" }}>日付</span>
        <span style={{ flex: 1 }}>タグ</span>
        <span style={{ flex: "0 0 28px" }}>気分</span>
        <span style={{ flex: "0 0 36px" }}>時間</span>
        <span style={{ flex: "0 0 48px" }}></span>
      </div>

      <div className="log-list-scroll">
        {logs.length === 0 ? (
          <div className="log-list-empty">ログがまだありません</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="log-entry">
              <span className="log-entry-date">{log.date}</span>
              <div className="log-entry-tags">
                {log.tags.map((tag) => (
                  <span key={tag} className="log-tag">{tag}</span>
                ))}
              </div>
              <span className="log-entry-mood">
                {log.mood != null ? (MOOD_SHORT[log.mood] ?? "-") : "-"}
              </span>
              <span className="log-entry-time">
                {log.durationMinutes != null ? `${log.durationMinutes}分` : "—"}
              </span>
              <div className="log-entry-actions">
                <button
                  type="button"
                  className="log-action-btn"
                  onClick={() => setEditingLog(log)}
                >
                  編集
                </button>
                <button
                  type="button"
                  className="log-action-btn log-action-btn--delete"
                  onClick={() => handleDelete(log.id)}
                >
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editingLog && (
        <LogEditModal
          log={editingLog}
          onSaved={loadLogs}
          onClose={() => setEditingLog(null)}
        />
      )}
    </div>
  );
}
