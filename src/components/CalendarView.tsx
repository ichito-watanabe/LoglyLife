import { useState, useEffect } from "react";
import { getDb } from "../db";
import { activityLogs, activityLogCategories, categories } from "../db/schema";
import { and, gte, lte, eq } from "drizzle-orm";

type DayLog = {
  id: number;
  date: string;
  durationMinutes: number | null;
  mood: number | null;
  memo: string | null;
  tags: string[];
};

export function CalendarView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [logsInMonth, setLogsInMonth] = useState<DayLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => { loadMonthLogs(); }, [year, month]);

  async function loadMonthLogs() {
    const db = getDb();
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const to = `${year}-${String(month).padStart(2, "0")}-31`;

    const [logRows, catRows] = await Promise.all([
      db.select({
        id: activityLogs.id,
        date: activityLogs.date,
        durationMinutes: activityLogs.durationMinutes,
        mood: activityLogs.mood,
        memo: activityLogs.memo,
      }).from(activityLogs)
        .where(and(gte(activityLogs.date, from), lte(activityLogs.date, to))),

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

    setLogsInMonth(logRows.map((log) => {
      const cats = catInfoByLog.get(log.id) ?? [];
      const leafCats = cats.filter((c) => !cats.some((other) => other.parentId === c.id));
      return { ...log, tags: leafCats.map((c) => c.name) };
    }));
  }

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const logsByDate = new Map<string, DayLog[]>();
  for (const log of logsInMonth) {
    if (!logsByDate.has(log.date)) logsByDate.set(log.date, []);
    logsByDate.get(log.date)!.push(log);
  }

  const selectedLogs = selectedDate ? (logsByDate.get(selectedDate) ?? []) : [];
  const todayStr = today.toISOString().split("T")[0];

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
        <button onClick={prevMonth}>←</button>
        <h2 style={{ margin: 0 }}>{year}年{month}月</h2>
        <button onClick={nextMonth}>→</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }}>
        {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
          <div key={d} style={{ fontWeight: "bold", padding: "4px", color: d === "日" ? "#ef4444" : d === "土" ? "#3b82f6" : undefined }}>
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayLogs = logsByDate.get(dateStr) ?? [];
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr;

          return (
            <div
              key={i}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              style={{
                padding: "6px 4px",
                borderRadius: "4px",
                cursor: "pointer",
                background: isSelected ? "#dbeafe" : isToday ? "#fef9c3" : "transparent",
                border: "1px solid #e2e8f0",
                minHeight: "48px",
              }}
            >
              <div style={{ fontSize: "0.85em" }}>{day}</div>
              {dayLogs.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", gap: "2px", marginTop: "4px" }}>
                  {dayLogs.slice(0, 3).map((_, idx) => (
                    <span key={idx} style={{ width: "6px", height: "6px", background: "#3b82f6", borderRadius: "50%", display: "inline-block" }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div style={{ marginTop: "16px", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
          <h3 style={{ marginTop: 0 }}>{selectedDate} のログ</h3>
          {selectedLogs.length === 0 ? (
            <p>この日のログはありません</p>
          ) : (
            <ul style={{ paddingLeft: "16px" }}>
              {selectedLogs.map((log) => (
                <li key={log.id} style={{ marginBottom: "6px" }}>
                  {log.tags.join(" / ")}
                  {log.durationMinutes != null && ` · ${log.durationMinutes}分`}
                  {log.mood != null && ` · ${["", "最悪", "悪い", "普通", "良い", "最高"][log.mood]}`}
                  {log.memo && ` · ${log.memo}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
