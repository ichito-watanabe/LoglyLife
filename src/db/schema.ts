import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  parentId: integer("parent_id"),
  color: text("color"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  title: text("title"),
  durationMinutes: integer("duration_minutes"),
  memo: text("memo"),
  mood: integer("mood"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const activityLogCategories = sqliteTable("activity_log_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  logId: integer("log_id").notNull().references(() => activityLogs.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  recurrenceDays: text("recurrence_days"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const taskCategories = sqliteTable("task_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
});

export const taskCompletions = sqliteTable("task_completions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  completedDate: text("completed_date").notNull(),
  durationMinutes: integer("duration_minutes"),
  memo: text("memo"),
  logId: integer("log_id"),
});
