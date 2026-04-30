import { useEffect, useState } from "react";
import { getDb } from "../db";
import { activityLogs, activityLogCategories, categories } from "../db/schema";
import { and, gte, lte, eq } from "drizzle-orm";

type Stats = {
  totalLogs: number;
  totalMinutes: number;
  avgMood: number | null;
  topCategories: { name: string; count: number }[];
};

export function Dashboard() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => { loadStats(); }, [year, month]);

  async function loadStats() {
    const db = getDb();
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const to = `${year}-${String(month).padStart(2, "0")}-31`;

    const [logRows, catRows] = await Promise.all([
      db.select({
        id: activityLogs.id,
        durationMinutes: activityLogs.durationMinutes,
        mood: activityLogs.mood,
      }).from(activityLogs)
        .where(and(gte(activityLogs.date, from), lte(activityLogs.date, to))),

      db.select({
        logId: activityLogCategories.logId,
        categoryName: categories.name,
      }).from(activityLogCategories)
        .innerJoin(categories, eq(categories.id, activityLogCategories.categoryId)),
    ]);

    const logIds = new Set(logRows.map((l) => l.id));
    const monthCatRows = catRows.filter((r) => logIds.has(r.logId));

    const catCount = new Map<string, number>();
    for (const row of monthCatRows) {
      catCount.set(row.categoryName, (catCount.get(row.categoryName) ?? 0) + 1);
    }

    const topCategories = [...catCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const moodLogs = logRows.filter((l) => l.mood != null);
    const avgMood = moodLogs.length > 0
      ? moodLogs.reduce((sum, l) => sum + l.mood!, 0) / moodLogs.length
      : null;

    setStats({
      totalLogs: logRows.length,
      totalMinutes: logRows.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0),
      avgMood,
      topCategories,
    });
  }

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  const formatMinutes = (min: number) =>
    min >= 60 ? `${Math.floor(min / 60)}h${min % 60}m` : `${min}m`;

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
        <button onClick={prevMonth}>←</button>
        <h2 style={{ margin: 0 }}>{year}年{month}月のまとめ</h2>
        <button onClick={nextMonth}>→</button>
      </div>

      {stats && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
            {[
              { value: String(stats.totalLogs), label: "ログ数" },
              { value: formatMinutes(stats.totalMinutes), label: "合計時間" },
              { value: stats.avgMood != null ? stats.avgMood.toFixed(1) : "—", label: "平均気分" },
            ].map(({ value, label }) => (
              <div key={label} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                <div style={{ fontSize: "2em", fontWeight: "bold" }}>{value}</div>
                <div style={{ color: "#64748b", marginTop: "4px" }}>{label}</div>
              </div>
            ))}
          </div>

          <h3>よく使ったカテゴリ</h3>
          {stats.topCategories.length === 0 ? (
            <p>この月のデータがありません</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {stats.topCategories.map(({ name, count }) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "80px", fontSize: "0.9em", flexShrink: 0 }}>{name}</div>
                  <div style={{
                    height: "20px",
                    background: "#3b82f6",
                    borderRadius: "4px",
                    width: `${(count / stats.topCategories[0].count) * 200}px`,
                    minWidth: "4px",
                  }} />
                  <div style={{ fontSize: "0.85em", color: "#64748b" }}>{count}件</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
