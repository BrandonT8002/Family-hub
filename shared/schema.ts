import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";
import { users } from "./models/auth";

export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id").references(() => users.id).notNull(),
  themeConfig: jsonb("theme_config").default({
    home: "#b3d9ff",
    schedule: "#e0b3ff",
    money: "#ffb3c1",
    groceries: "#ffd9b3",
    chat: "#b3ffcc"
  }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  role: text("role").notNull(), // Owner, Adult, Teen, Child, Caregiver
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  creatorId: text("creator_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  recurrence: text("recurrence").notNull().default("One-time"), // One-time, Daily, Weekly, Monthly, Yearly
  isPersonal: boolean("is_personal").notNull().default(false),
  notes: text("notes"),
  location: text("location"),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  creatorId: text("creator_id").references(() => users.id).notNull(),
  amount: numeric("amount").notNull(),
  category: text("category").notNull(),
  vendor: text("vendor"),
  description: text("description").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  notes: text("notes"),
  tag: text("tag"), // grocery, subscription, gas, etc.
});

export const financialSchedule = pgTable("financial_schedule", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  title: text("title").notNull(),
  amount: numeric("amount").notNull(),
  type: text("type").notNull(), // One-time, Recurring
  frequency: text("frequency"), // Weekly, Monthly, Yearly
  dueDate: timestamp("due_date").notNull(),
  isPayday: boolean("is_payday").default(false),
});

export const savingsGoals = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount").notNull(),
  currentAmount: numeric("current_amount").default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groceryLists = pgTable("grocery_lists", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  name: text("name").notNull(),
  type: text("type").default("Needs"), // Wants vs Needs
  storeName: text("store_name"),
});

export const groceryItems = pgTable("grocery_items", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").references(() => groceryLists.id).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: numeric("price").default("0"),
  isChecked: boolean("is_checked").default(false),
  notes: text("notes"),
  assignedTo: text("assigned_to").references(() => users.id),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  senderId: text("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFamilySchema = createInsertSchema(families).omit({ id: true, createdAt: true });
export type InsertFamily = z.infer<typeof insertFamilySchema>;
export type Family = typeof families.$inferSelect;

export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, date: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export const insertGroceryListSchema = createInsertSchema(groceryLists).omit({ id: true });
export type InsertGroceryList = z.infer<typeof insertGroceryListSchema>;
export type GroceryList = typeof groceryLists.$inferSelect;

export const insertGroceryItemSchema = createInsertSchema(groceryItems).omit({ id: true });
export type InsertGroceryItem = z.infer<typeof insertGroceryItemSchema>;
export type GroceryItem = typeof groceryItems.$inferSelect;

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
