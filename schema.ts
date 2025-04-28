import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["admin", "karyawan"] }).notNull(),
  full_name: text("full_name"),
  avatar_url: text("avatar_url"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true
});

// Attendance table
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  check_in: timestamp("check_in").notNull(),
  check_out: timestamp("check_out"),
  note: text("note"),
  location: text("location").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  created_at: true
});

// Sales table
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  invoice_number: text("invoice_number").notNull().unique(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  customer_name: text("customer_name").notNull(),
  sale_date: timestamp("sale_date").notNull(),
  total_amount: real("total_amount").notNull(),
  tax_amount: real("tax_amount").notNull(),
  discount_amount: real("discount_amount").notNull(),
  payment_method: text("payment_method").notNull(),
  notes: text("notes"),
  status: text("status", { enum: ["pending", "completed", "cancelled"] }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  created_at: true
});

// Sale items table
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  sale_id: integer("sale_id").references(() => sales.id).notNull(),
  product_id: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unit_price: real("unit_price").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
  created_at: true
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  category_id: integer("category_id").references(() => productCategories.id).notNull(),
  sku: text("sku").notNull().unique(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  created_at: true
});

// Product categories table
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  created_at: true
});

// Work reports table
export const workReports = pgTable("work_reports", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  report_type: text("report_type").notNull(),
  department: text("department").notNull(),
  tasks: text("tasks").notNull(),
  outcomes: text("outcomes").notNull(),
  challenges: text("challenges"),
  next_steps: text("next_steps"),
  status: text("status", { enum: ["draft", "submitted", "in_progress", "review_needed", "completed"] }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertWorkReportSchema = createInsertSchema(workReports).omit({
  id: true,
  created_at: true
});

// Export types for each schema
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;

export type WorkReport = typeof workReports.$inferSelect;
export type InsertWorkReport = z.infer<typeof insertWorkReportSchema>;
