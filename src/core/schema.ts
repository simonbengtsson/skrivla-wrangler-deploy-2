import { sqliteTable, text } from "drizzle-orm/sqlite-core"

export const pages = sqliteTable("pages", {
  id: text().primaryKey(),
  name: text().notNull(),
  creatorId: text("creator_id").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
})
