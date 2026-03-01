import { db } from "./db";
import {
  families, familyMembers, events, expenses, groceryLists, groceryItems, chatMessages, users,
  financialSchedule, savingsGoals, conversations, conversationParticipants, blocks,
  type InsertFamily, type InsertEvent, type InsertExpense, type InsertGroceryList, type InsertGroceryItem, type InsertChatMessage
} from "@shared/schema";
import { eq, desc, and, or, ne, inArray } from "drizzle-orm";

export interface IStorage {
  getFamilyForUser(userId: string): Promise<typeof families.$inferSelect | null>;
  createFamily(name: string, ownerId: string): Promise<typeof families.$inferSelect>;
  updateFamily(id: number, data: Partial<typeof families.$inferSelect>): Promise<typeof families.$inferSelect>;

  getFamilyMembers(familyId: number): Promise<any[]>;
  getMemberRole(familyId: number, userId: string): Promise<string | null>;

  getEvents(familyId: number): Promise<(typeof events.$inferSelect)[]>;
  createEvent(event: InsertEvent): Promise<typeof events.$inferSelect>;

  getExpenses(familyId: number): Promise<(typeof expenses.$inferSelect)[]>;
  createExpense(expense: any): Promise<typeof expenses.$inferSelect>;

  getFinancialSchedule(familyId: number): Promise<(typeof financialSchedule.$inferSelect)[]>;
  createFinancialSchedule(item: any): Promise<typeof financialSchedule.$inferSelect>;

  getSavingsGoals(familyId: number): Promise<(typeof savingsGoals.$inferSelect)[]>;
  createSavingsGoal(goal: any): Promise<typeof savingsGoals.$inferSelect>;
  updateSavingsGoal(id: number, currentAmount: string): Promise<typeof savingsGoals.$inferSelect>;

  getGroceryLists(familyId: number): Promise<(typeof groceryLists.$inferSelect)[]>;
  createGroceryList(list: InsertGroceryList): Promise<typeof groceryLists.$inferSelect>;
  getGroceryItems(listId: number): Promise<(typeof groceryItems.$inferSelect)[]>;
  createGroceryItem(item: InsertGroceryItem): Promise<typeof groceryItems.$inferSelect>;
  toggleGroceryItem(id: number, isChecked: boolean): Promise<typeof groceryItems.$inferSelect>;

  getConversationsForUser(familyId: number, userId: string): Promise<any[]>;
  getOrCreateGroupConversation(familyId: number): Promise<typeof conversations.$inferSelect>;
  createDMConversation(familyId: number, creatorId: string, recipientId: string): Promise<typeof conversations.$inferSelect>;
  getConversation(id: number): Promise<typeof conversations.$inferSelect | null>;
  acceptConversation(id: number): Promise<typeof conversations.$inferSelect>;

  getChatMessages(conversationId: number): Promise<any[]>;
  getChatMessagesByFamily(familyId: number): Promise<any[]>;
  createChatMessage(message: InsertChatMessage): Promise<typeof chatMessages.$inferSelect>;
  deleteMessage(id: number, userId: string): Promise<void>;

  blockUser(blockerId: string, blockedId: string, familyId: number): Promise<typeof blocks.$inferSelect>;
  unblockUser(blockerId: string, blockedId: string, familyId: number): Promise<void>;
  getBlocks(userId: string, familyId: number): Promise<(typeof blocks.$inferSelect)[]>;
  isBlocked(userId1: string, userId2: string, familyId: number): Promise<boolean>;
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

  async getFamilyMembers(familyId: number) {
    const members = await db.select({
      id: familyMembers.id,
      familyId: familyMembers.familyId,
      userId: familyMembers.userId,
      role: familyMembers.role,
      displayName: familyMembers.displayName,
      dateOfBirth: familyMembers.dateOfBirth,
      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
      }
    })
    .from(familyMembers)
    .innerJoin(users, eq(familyMembers.userId, users.id))
    .where(eq(familyMembers.familyId, familyId));
    return members;
  }

  async getMemberRole(familyId: number, userId: string) {
    const [member] = await db.select().from(familyMembers).where(
      and(eq(familyMembers.familyId, familyId), eq(familyMembers.userId, userId))
    );
    return member?.role || null;
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

  async getOrCreateGroupConversation(familyId: number) {
    const [existing] = await db.select().from(conversations).where(
      and(eq(conversations.familyId, familyId), eq(conversations.type, "group"))
    );
    if (existing) return existing;

    const [conv] = await db.insert(conversations).values({
      familyId,
      type: "group",
      name: "Family Chat",
      status: "active",
    }).returning();

    const members = await db.select().from(familyMembers).where(eq(familyMembers.familyId, familyId));
    for (const member of members) {
      await db.insert(conversationParticipants).values({
        conversationId: conv.id,
        userId: member.userId,
      });
    }

    return conv;
  }

  async getConversationsForUser(familyId: number, userId: string) {
    const participantRows = await db.select()
      .from(conversationParticipants)
      .innerJoin(conversations, eq(conversationParticipants.conversationId, conversations.id))
      .where(
        and(
          eq(conversationParticipants.userId, userId),
          eq(conversations.familyId, familyId)
        )
      );

    const result = [];
    for (const row of participantRows) {
      const conv = row.conversations;
      const participants = await db.select({
        userId: conversationParticipants.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(conversationParticipants.userId, users.id))
      .where(eq(conversationParticipants.conversationId, conv.id));

      const lastMsg = await db.select({
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
        senderId: chatMessages.senderId,
      })
      .from(chatMessages)
      .where(and(eq(chatMessages.conversationId, conv.id), eq(chatMessages.isDeleted, false)))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1);

      result.push({
        ...conv,
        participants,
        lastMessage: lastMsg[0] || null,
      });
    }

    return result;
  }

  async createDMConversation(familyId: number, creatorId: string, recipientId: string) {
    const allConvs = await db.select()
      .from(conversations)
      .where(and(eq(conversations.familyId, familyId), eq(conversations.type, "dm")));

    for (const conv of allConvs) {
      const parts = await db.select().from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conv.id));
      const userIds = parts.map(p => p.userId);
      if (userIds.includes(creatorId) && userIds.includes(recipientId)) {
        return conv;
      }
    }

    const [conv] = await db.insert(conversations).values({
      familyId,
      type: "dm",
      status: "pending",
      createdBy: creatorId,
    }).returning();

    await db.insert(conversationParticipants).values([
      { conversationId: conv.id, userId: creatorId },
      { conversationId: conv.id, userId: recipientId },
    ]);

    return conv;
  }

  async getConversation(id: number) {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv || null;
  }

  async acceptConversation(id: number) {
    const [updated] = await db.update(conversations)
      .set({ status: "active" })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async getChatMessages(conversationId: number) {
    const msgs = await db.select({
      id: chatMessages.id,
      conversationId: chatMessages.conversationId,
      familyId: chatMessages.familyId,
      senderId: chatMessages.senderId,
      content: chatMessages.content,
      isDeleted: chatMessages.isDeleted,
      createdAt: chatMessages.createdAt,
      user: {
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      }
    })
    .from(chatMessages)
    .innerJoin(users, eq(chatMessages.senderId, users.id))
    .where(and(eq(chatMessages.conversationId, conversationId), eq(chatMessages.isDeleted, false)))
    .orderBy(desc(chatMessages.createdAt))
    .limit(100);

    return msgs.reverse();
  }

  async getChatMessagesByFamily(familyId: number) {
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
    .where(and(eq(chatMessages.familyId, familyId), eq(chatMessages.isDeleted, false)))
    .orderBy(desc(chatMessages.createdAt))
    .limit(50);
    
    return msgs.reverse();
  }

  async createChatMessage(message: InsertChatMessage) {
    const [newMsg] = await db.insert(chatMessages).values(message).returning();
    return newMsg;
  }

  async deleteMessage(id: number, userId: string) {
    await db.update(chatMessages)
      .set({ isDeleted: true })
      .where(and(eq(chatMessages.id, id), eq(chatMessages.senderId, userId)));
  }

  async blockUser(blockerId: string, blockedId: string, familyId: number) {
    const [block] = await db.insert(blocks).values({ blockerId, blockedId, familyId }).returning();
    return block;
  }

  async unblockUser(blockerId: string, blockedId: string, familyId: number) {
    await db.delete(blocks).where(
      and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId), eq(blocks.familyId, familyId))
    );
  }

  async getBlocks(userId: string, familyId: number) {
    return await db.select().from(blocks).where(
      and(eq(blocks.blockerId, userId), eq(blocks.familyId, familyId))
    );
  }

  async isBlocked(userId1: string, userId2: string, familyId: number) {
    const [block] = await db.select().from(blocks).where(
      and(
        or(
          and(eq(blocks.blockerId, userId1), eq(blocks.blockedId, userId2)),
          and(eq(blocks.blockerId, userId2), eq(blocks.blockedId, userId1))
        ),
        eq(blocks.familyId, familyId)
      )
    );
    return !!block;
  }
}

export const storage = new DatabaseStorage();
