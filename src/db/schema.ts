import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const categories = sqliteTable("categories", {
    id: integer("id").primaryKey({ autoIncrement: true}),
    name: text("name").notNull(),
    parentId: integer("parent_id"),
    color: text("color"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),

});

export const activityLogs = sqliteTable("activity_logs", {
    id : integer("id").primaryKey({ autoIncrement: true}),
    date : text("date").notNull(),
    categoryId: integer("category_id").notNull().references(() => categories.id),
    title: text("title").notNull(),
    durationMinutes: integer("duration_minutes"),
    memo : text("memo"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

