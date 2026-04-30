import { useState, useEffect } from "react";
import { getDb, insertActivityLog, insertTask } from "../db";
import { tasks, taskCategories, taskCompletions, categories, activityLogCategories } from "../db/schema";
import { eq } from "drizzle-orm";
import { Category, buildPath, getAncestorIds } from "../db/categoryUtils";
import { CategoryTree } from "./CategoryTree";
import { TaskConsumeModal } from "./TaskConsumeModal";

type TaskItem = {
  id: number;
  title: string;
  recurrenceDays: string | null;
  tags: string[];
  allCategoryIds: number[];
  completedToday: boolean;
  completionInfo?: { durationMinutes: number | null; memo: string | null };
};

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function TaskPage() {
  const [taskList, setTaskList] = useState<TaskItem[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [consumingTask, setConsumingTask] = useState<TaskItem | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<number>>(new Set());

  const todayStr = new Date().toISOString().split("T")[0];
  const todayDow = new Date().getDay();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const db = getDb();

    const [allTasks, catRows, todayCompletionRows, allCompletionRows, allCats] = await Promise.all([
      db.select().from(tasks),
      db.select({
        taskId: taskCategories.taskId,
        categoryId: taskCategories.categoryId,
        categoryName: categories.name,
        parentId: categories.parentId,
      }).from(taskCategories)
        .innerJoin(categories, eq(categories.id, taskCategories.categoryId)),
      db.select().from(taskCompletions).where(eq(taskCompletions.completedDate, todayStr)),
      db.select({ taskId: taskCompletions.taskId }).from(taskCompletions),
      db.select({ id: categories.id, name: categories.name, parentId: categories.parentId }).from(categories),
    ]);

    setCategoryList(allCats);

    type CatInfo = { id: number; name: string; parentId: number | null };
    const catInfoByTask = new Map<number, CatInfo[]>();
    for (const row of catRows) {
      if (!catInfoByTask.has(row.taskId)) catInfoByTask.set(row.taskId, []);
      catInfoByTask.get(row.taskId)!.push({ id: row.categoryId, name: row.categoryName, parentId: row.parentId });
    }

    const todayCompletionByTask = new Map(todayCompletionRows.map((c) => [c.taskId, c]));
    const everCompletedIds = new Set(allCompletionRows.map((c) => c.taskId));

    const result: TaskItem[] = [];
    for (const task of allTasks) {
      const cats = catInfoByTask.get(task.id) ?? [];
      const leafCats = cats.filter((c) => !cats.some((other) => other.parentId === c.id));

      if (task.recurrenceDays === null) {
        if (!everCompletedIds.has(task.id)) {
          result.push({
            id: task.id,
            title: task.title,
            recurrenceDays: null,
            tags: leafCats.map((c) => c.name),
            allCategoryIds: cats.map((c) => c.id),
            completedToday: false,
          });
        }
      } else {
        const days = task.recurrenceDays.split(",").map(Number);
        if (days.includes(todayDow)) {
          const completion = todayCompletionByTask.get(task.id);
          result.push({
            id: task.id,
            title: task.title,
            recurrenceDays: task.recurrenceDays,
            tags: leafCats.map((c) => c.name),
            allCategoryIds: cats.map((c) => c.id),
            completedToday: !!completion,
            completionInfo: completion
              ? { durationMinutes: completion.durationMinutes, memo: completion.memo }
              : undefined,
          });
        }
      }
    }

    setTaskList(result);
  }

  function toggleDay(d: number) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });
  }

  function toggleCategory(id: number) {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < 3) { next.add(id); }
      return next;
    });
  }

  function removeCategory(id: number) {
    setSelectedCategoryIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (isRecurring && selectedDays.size === 0) return;

    const recurrenceDays = isRecurring ? [...selectedDays].sort().join(",") : null;
    const taskId = await insertTask({ title: title.trim(), recurrenceDays });

    if (selectedCategoryIds.size > 0) {
      const db = getDb();
      const allCatIds = new Set<number>();
      for (const catId of selectedCategoryIds) {
        for (const id of getAncestorIds(categoryList, catId)) {
          allCatIds.add(id);
        }
      }
      for (const catId of allCatIds) {
        await db.insert(taskCategories).values({ taskId, categoryId: catId });
      }
    }

    setTitle("");
    setSelectedDays(new Set());
    setSelectedCategoryIds(new Set());
    setIsRecurring(false);
    setShowForm(false);
    await loadData();
  }

  async function handleConsume(task: TaskItem, duration: number | null, memo: string) {
    const db = getDb();
    const logId = await insertActivityLog({
      date: todayStr,
      title: task.title,
      durationMinutes: duration,
      memo: memo || null,
      mood: null,
    });

    for (const catId of task.allCategoryIds) {
      await db.insert(activityLogCategories).values({ logId, categoryId: catId });
    }

    await db.insert(taskCompletions).values({
      taskId: task.id,
      completedDate: todayStr,
      durationMinutes: duration,
      memo: memo || null,
      logId,
    });

    setConsumingTask(null);
    await loadData();
  }

  async function handleDelete(taskId: number) {
    const db = getDb();
    await db.delete(taskCompletions).where(eq(taskCompletions.taskId, taskId));
    await db.delete(taskCategories).where(eq(taskCategories.taskId, taskId));
    await db.delete(tasks).where(eq(tasks.id, taskId));
    await loadData();
  }

  const dueTasks = taskList.filter((t) => !t.completedToday);
  const completedTasks = taskList.filter((t) => t.completedToday);

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ margin: 0 }}>今日のタスク</h2>
        <button onClick={() => setShowForm((v) => !v)}>{showForm ? "閉じる" : "+ タスク追加"}</button>
      </div>

      {showForm && (
        <form onSubmit={handleAddTask} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
          <div style={{ marginBottom: "10px" }}>
            <label>タスク名</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required style={{ display: "block", width: "100%", marginTop: "4px", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>
              <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
              {" "}繰り返す
            </label>
            {isRecurring && (
              <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                {DAY_LABELS.map((label, i) => (
                  <div
                    key={i}
                    onClick={() => toggleDay(i)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      background: selectedDays.has(i) ? "#dbeafe" : "#f1f5f9",
                      border: `1px solid ${selectedDays.has(i) ? "#3b82f6" : "#e2e8f0"}`,
                      fontSize: "0.9em",
                      userSelect: "none",
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label>カテゴリ（最大3つ）</label>
            <CategoryTree allCategories={categoryList} selectedIds={selectedCategoryIds} onSelect={toggleCategory} />
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
          <button type="submit">追加する</button>
        </form>
      )}

      {dueTasks.length === 0 && completedTasks.length === 0 && (
        <p style={{ color: "#64748b" }}>今日のタスクはありません</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {dueTasks.map((task) => (
          <div key={task.id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: "bold" }}>{task.title}</div>
              {task.tags.length > 0 && (
                <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                  {task.tags.map((tag) => (
                    <span key={tag} style={{ background: "#f1f5f9", borderRadius: "4px", padding: "1px 6px", fontSize: "0.8em" }}>{tag}</span>
                  ))}
                </div>
              )}
              {task.recurrenceDays && (
                <div style={{ fontSize: "0.8em", color: "#94a3b8", marginTop: "2px" }}>
                  {task.recurrenceDays.split(",").map((d) => DAY_LABELS[Number(d)]).join("・")}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              <button onClick={() => setConsumingTask(task)}>消化する</button>
              <button onClick={() => handleDelete(task.id)} style={{ color: "#ef4444" }}>削除</button>
            </div>
          </div>
        ))}
      </div>

      {completedTasks.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <button
            onClick={() => setShowCompleted((v) => !v)}
            style={{ color: "#64748b", fontSize: "0.9em", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            {showCompleted ? "▼" : "▶"} 今日完了したタスク（{completedTasks.length}件）
          </button>
          {showCompleted && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
              {completedTasks.map((task) => (
                <div key={task.id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", opacity: 0.6 }}>
                  <div style={{ fontWeight: "bold", textDecoration: "line-through" }}>{task.title}</div>
                  <div style={{ fontSize: "0.85em", color: "#64748b", marginTop: "4px" }}>
                    {task.completionInfo?.durationMinutes != null && `${task.completionInfo.durationMinutes}分`}
                    {task.completionInfo?.memo && ` · ${task.completionInfo.memo}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {consumingTask && (
        <TaskConsumeModal
          taskTitle={consumingTask.title}
          onConfirm={(duration, memo) => handleConsume(consumingTask, duration, memo)}
          onClose={() => setConsumingTask(null)}
        />
      )}
    </div>
  );
}
