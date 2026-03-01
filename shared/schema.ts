import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id").references(() => users.id).notNull(),
  fontFamily: text("font_family").default("Bricolage Grotesque"),
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
  role: text("role").notNull(), // Owner, Adult, Teen, Youth, Child, Caregiver
  displayName: text("display_name"),
  dateOfBirth: timestamp("date_of_birth"),
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
  recurrence: text("recurrence").notNull().default("One-time"),
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
  tag: text("tag"),
});

export const financialSchedule = pgTable("financial_schedule", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  creatorId: text("creator_id").references(() => users.id),
  title: text("title").notNull(),
  amount: numeric("amount").notNull(),
  type: text("type").notNull(),
  frequency: text("frequency"),
  dueDate: timestamp("due_date").notNull(),
  isPayday: boolean("is_payday").default(false),
  billType: text("bill_type"),
  category: text("category"),
  notes: text("notes"),
  isPaid: boolean("is_paid").default(false),
  autoPay: boolean("auto_pay").default(false),
  reminderDays: integer("reminder_days").default(3),
});

export const savingsGoals = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount").notNull(),
  currentAmount: numeric("current_amount").default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goalCategories = pgTable("goal_categories", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color"),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  creatorId: text("creator_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => goalCategories.id),
  type: text("type").notNull().default("short-term"),
  progressType: text("progress_type").notNull().default("checklist"),
  visibility: text("visibility").notNull().default("personal"),
  status: text("status").notNull().default("active"),
  targetValue: numeric("target_value"),
  currentValue: numeric("current_value").default("0"),
  unit: text("unit"),
  dueDate: timestamp("due_date"),
  streak: integer("streak").default(0),
  bestStreak: integer("best_streak").default(0),
  lastStreakDate: timestamp("last_streak_date"),
  linkedSavingsGoalId: integer("linked_savings_goal_id").references(() => savingsGoals.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const goalItems = pgTable("goal_items", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").references(() => goals.id).notNull(),
  title: text("title").notNull(),
  isCompleted: boolean("is_completed").default(false),
  sortOrder: integer("sort_order").default(0),
});

export const groceryLists = pgTable("grocery_lists", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  creatorId: text("creator_id").references(() => users.id),
  name: text("name").notNull(),
  type: text("type").default("Needs"),
  storeName: text("store_name"),
  isPrivate: boolean("is_private").default(false),
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

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  type: text("type").notNull().default("group"), // group, dm
  name: text("name"),
  status: text("status").notNull().default("active"), // active, pending (for message requests)
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  familyId: integer("family_id").references(() => families.id).notNull(),
  senderId: text("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // text, image, video, voice
  mediaUrl: text("media_url"),
  mediaDuration: integer("media_duration"), // seconds for voice/video
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const diaryEntries = pgTable("diary_entries", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  title: text("title"),
  body: text("body").notNull(),
  mood: text("mood"),
  tags: text("tags").array(),
  photoUrls: text("photo_urls").array(),
  isPrivate: boolean("is_private").default(true).notNull(),
  sharedWith: text("shared_with").array(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const diarySettings = pgTable("diary_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  diaryPin: text("diary_pin"),
  isLocked: boolean("is_locked").default(true).notNull(),
  weeklyReflectionEnabled: boolean("weekly_reflection_enabled").default(false).notNull(),
});

export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  blockerId: text("blocker_id").references(() => users.id).notNull(),
  blockedId: text("blocked_id").references(() => users.id).notNull(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
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

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true, isDeleted: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true });
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export const insertBlockSchema = createInsertSchema(blocks).omit({ id: true, createdAt: true });
export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type Block = typeof blocks.$inferSelect;

export const insertFinancialScheduleSchema = createInsertSchema(financialSchedule).omit({ id: true });
export type InsertFinancialSchedule = z.infer<typeof insertFinancialScheduleSchema>;
export type FinancialSchedule = typeof financialSchedule.$inferSelect;

export const insertSavingsGoalSchema = createInsertSchema(savingsGoals).omit({ id: true, createdAt: true });
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type SavingsGoal = typeof savingsGoals.$inferSelect;

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

export const insertGoalItemSchema = createInsertSchema(goalItems).omit({ id: true });
export type InsertGoalItem = z.infer<typeof insertGoalItemSchema>;
export type GoalItem = typeof goalItems.$inferSelect;

export const insertGoalCategorySchema = createInsertSchema(goalCategories).omit({ id: true });
export type InsertGoalCategory = z.infer<typeof insertGoalCategorySchema>;
export type GoalCategory = typeof goalCategories.$inferSelect;

export const insertDiaryEntrySchema = createInsertSchema(diaryEntries).omit({ id: true, createdAt: true, updatedAt: true, isDeleted: true, deletedAt: true });
export type InsertDiaryEntry = z.infer<typeof insertDiaryEntrySchema>;
export type DiaryEntry = typeof diaryEntries.$inferSelect;

export type DiarySettings = typeof diarySettings.$inferSelect;

export type FamilyMember = typeof familyMembers.$inferSelect;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
