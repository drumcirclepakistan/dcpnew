import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("founder"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const showTypeEnum = pgEnum("show_type", ["Corporate", "Private", "Public", "University"]);
export const showStatusEnum = pgEnum("show_status", ["upcoming", "completed", "cancelled"]);

export const shows = pgTable("shows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  city: text("city").notNull(),
  showType: showTypeEnum("show_type").notNull(),
  organizationName: text("organization_name"),
  totalAmount: integer("total_amount").notNull(),
  advancePayment: integer("advance_payment").notNull().default(0),
  showDate: timestamp("show_date").notNull(),
  status: showStatusEnum("status").notNull().default("upcoming"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  userId: varchar("user_id").notNull(),
});

export const insertShowSchema = createInsertSchema(shows).omit({
  id: true,
  createdAt: true,
  userId: true,
}).extend({
  title: z.string().min(1, "Title is required"),
  city: z.string().min(1, "City is required"),
  totalAmount: z.coerce.number().min(0, "Amount must be positive"),
  advancePayment: z.coerce.number().min(0, "Advance must be positive"),
  showDate: z.coerce.date(),
});

export type InsertShow = z.infer<typeof insertShowSchema>;
export type Show = typeof shows.$inferSelect;

export const showTypes = ["Corporate", "Private", "Public", "University"] as const;
export type ShowType = typeof showTypes[number];
