import { pgTable, serial, timestamp, varchar, boolean, numeric, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
})

// 账单表
export const accounts = pgTable("accounts", {
	id: serial("id").primaryKey(),
	customer_name: varchar("customer_name", { length: 100 }).notNull(),
	phone: varchar("phone", { length: 20 }),
	amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
	is_paid: boolean("is_paid").notNull().default(false),
	item_description: text("item_description").notNull(),
	account_date: varchar("account_date", { length: 10 }).notNull(),
	image_url: text("image_url"),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
})
