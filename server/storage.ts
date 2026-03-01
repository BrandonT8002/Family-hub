import { db } from "./db";
import {
  families, familyMembers, events, expenses, groceryLists, groceryItems, chatMessages, users,
  financialSchedule, savingsGoals,
  type InsertFamily, type InsertEvent, type InsertExpense, type InsertGroceryList, type InsertGroceryItem, type InsertChatMessage
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Family
  getFamilyForUser(userId: string): Promise<typeof families.$inferSelect | null>;
  createFamily(name: string, ownerId: string): Promise<typeof families.$inferSelect>;
  updateFamily(id: number, data: Partial<typeof families.$inferSelect>): Promise<typeof families.$inferSelect>;
  
  // Events
  getEvents(familyId: number): Promise<(typeof events.$inferSelect)[]>;
  createEvent(event: InsertEvent): Promise<typeof events.$inferSelect>;
  
  // Expenses
  getExpenses(familyId: number): Promise<(typeof expenses.$inferSelect)[]>;
  createExpense(expense: any): Promise<typeof expenses.$inferSelect>;
  
  // Financial Schedule
  getFinancialSchedule(familyId: number): Promise<(typeof financialSchedule.$inferSelect)[]>;
  createFinancialSchedule(item: any): Promise<typeof financialSchedule.$inferSelect>;

  // Savings Goals
  getSavingsGoals(familyId: number): Promise<(typeof savingsGoals.$inferSelect)[]>;
  createSavingsGoal(goal: any): Promise<typeof savingsGoals.$inferSelect>;
  updateSavingsGoal(id: number, currentAmount: string): Promise<typeof savingsGoals.$inferSelect>;

  // Groceries
  getGroceryLists(familyId: number): Promise<(typeof groceryLists.$inferSelect)[]>;
  createGroceryList(list: InsertGroceryList): Promise<typeof groceryLists.$inferSelect>;
  getGroceryItems(listId: number): Promise<(typeof groceryItems.$inferSelect)[]>;
  createGroceryItem(item: InsertGroceryItem): Promise<typeof groceryItems.$inferSelect>;
  toggleGroceryItem(id: number, isChecked: boolean): Promise<typeof groceryItems.$inferSelect>;

  // Chat
  getChatMessages(familyId: number): Promise<any[]>;
  createChatMessage(message: InsertChatMessage): Promise<typeof chatMessages.$inferSelect>;
}

export class DatabaseStorage implements IStorage {
  async getFamilyForUser(userId: string) {
    const [membership] = await db.select().from(familyMembers).where(eq(familyMembers.userId, userId));
    if (!membership) return null;
    const [family] = await db.select().from(families).where(eq(families.id, membership.familyId));
    return family || null;
  }

  async createFamily(name: string, ownerId: string) {
    const [family] = await db.insert(families).values({ 
      name, 
      ownerId,
      themeConfig: {
        home: "#b3d9ff",
        schedule: "#e0b3ff",
        money: "#ffb3c1",
        groceries: "#ffd9b3",
        chat: "#b3ffcc"
      }
    }).returning();
    await db.insert(familyMembers).values({ familyId: family.id, userId: ownerId, role: "Owner" });
    return family;
  }

  async updateFamily(id: number, data: Partial<typeof families.$inferSelect>) {
    const [updated] = await db.update(families).set(data).where(eq(families.id, id)).returning();
    return updated;
  }

  async getEvents(familyId: number) {
    return await db.select().from(events).where(eq(events.familyId, familyId));
  }
  
  async createEvent(event: any) {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async getExpenses(familyId: number) {
    return await db.select().from(expenses).where(eq(expenses.familyId, familyId));
  }

  async createExpense(expense: any) {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async getFinancialSchedule(familyId: number) {
    return await db.select().from(financialSchedule).where(eq(financialSchedule.familyId, familyId));
  }

  async createFinancialSchedule(item: any) {
    const [newItem] = await db.insert(financialSchedule).values(item).returning();
    return newItem;
  }

  async getSavingsGoals(familyId: number) {
    return await db.select().from(savingsGoals).where(eq(savingsGoals.familyId, familyId));
  }

  async createSavingsGoal(goal: any) {
    const [newGoal] = await db.insert(savingsGoals).values(goal).returning();
    return newGoal;
  }

  async updateSavingsGoal(id: number, currentAmount: string) {
    const [updated] = await db.update(savingsGoals).set({ currentAmount }).where(eq(savingsGoals.id, id)).returning();
    return updated;
  }

  async getGroceryLists(familyId: number) {
    return await db.select().from(groceryLists).where(eq(groceryLists.familyId, familyId));
  }

  async createGroceryList(list: InsertGroceryList) {
    const [newList] = await db.insert(groceryLists).values(list).returning();
    return newList;
  }

  async getGroceryItems(listId: number) {
    return await db.select().from(groceryItems).where(eq(groceryItems.listId, listId));
  }

  async createGroceryItem(item: InsertGroceryItem) {
    const [newItem] = await db.insert(groceryItems).values(item).returning();
    return newItem;
  }

  async toggleGroceryItem(id: number, isChecked: boolean) {
    const [updated] = await db.update(groceryItems).set({ isChecked }).where(eq(groceryItems.id, id)).returning();
    return updated;
  }

  async getChatMessages(familyId: number) {
    const msgs = await db.select({
      id: chatMessages.id,
      familyId: chatMessages.familyId,
      senderId: chatMessages.senderId,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
      user: {
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      }
    })
    .from(chatMessages)
    .innerJoin(users, eq(chatMessages.senderId, users.id))
    .where(eq(chatMessages.familyId, familyId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(50);
    
    return msgs.reverse();
  }

  async createChatMessage(message: InsertChatMessage) {
    const [newMsg] = await db.insert(chatMessages).values(message).returning();
    return newMsg;
  }
}

export const storage = new DatabaseStorage();
