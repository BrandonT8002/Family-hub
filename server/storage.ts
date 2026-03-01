import { db } from "./db";
import {
  families, familyMembers, events, expenses, groceryLists, groceryItems, chatMessages, users,
  financialSchedule, savingsGoals, conversations, conversationParticipants, blocks,
  diaryEntries, diarySettings, goals, goalItems, goalCategories, wishlists, wishlistItems,
  leaveTimeSettings, leaveTimeOverrides, leaveTimeTemplates,
  type InsertFamily, type InsertEvent, type InsertExpense, type InsertGroceryList, type InsertGroceryItem, type InsertChatMessage, type InsertDiaryEntry
} from "@shared/schema";
import { eq, desc, and, or, ne, inArray, isNull, asc } from "drizzle-orm";

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
  updateFinancialSchedule(id: number, familyId: number, data: Partial<typeof financialSchedule.$inferSelect>): Promise<typeof financialSchedule.$inferSelect>;
  deleteFinancialSchedule(id: number, familyId: number): Promise<void>;

  getSavingsGoals(familyId: number): Promise<(typeof savingsGoals.$inferSelect)[]>;
  createSavingsGoal(goal: any): Promise<typeof savingsGoals.$inferSelect>;
  updateSavingsGoal(id: number, currentAmount: string): Promise<typeof savingsGoals.$inferSelect>;

  getGroceryLists(familyId: number): Promise<(typeof groceryLists.$inferSelect)[]>;
  createGroceryList(list: InsertGroceryList): Promise<typeof groceryLists.$inferSelect>;
  getGroceryItems(listId: number): Promise<(typeof groceryItems.$inferSelect)[]>;
  createGroceryItem(item: InsertGroceryItem): Promise<typeof groceryItems.$inferSelect>;
  toggleGroceryItem(id: number, isChecked: boolean): Promise<typeof groceryItems.$inferSelect>;
  updateGroceryItem(id: number, data: Partial<typeof groceryItems.$inferSelect>): Promise<typeof groceryItems.$inferSelect>;
  deleteGroceryItem(id: number): Promise<void>;

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

  getGoalCategories(familyId: number): Promise<(typeof goalCategories.$inferSelect)[]>;
  createGoalCategory(data: any): Promise<typeof goalCategories.$inferSelect>;
  deleteGoalCategory(id: number, familyId: number): Promise<void>;

  getGoals(familyId: number): Promise<(typeof goals.$inferSelect)[]>;
  getGoal(id: number): Promise<typeof goals.$inferSelect | undefined>;
  createGoal(data: any): Promise<typeof goals.$inferSelect>;
  updateGoal(id: number, familyId: number, data: any): Promise<typeof goals.$inferSelect>;
  deleteGoal(id: number, familyId: number): Promise<void>;

  getGoalItems(goalId: number): Promise<(typeof goalItems.$inferSelect)[]>;
  createGoalItem(data: any): Promise<typeof goalItems.$inferSelect>;
  updateGoalItem(id: number, data: any): Promise<typeof goalItems.$inferSelect>;
  deleteGoalItem(id: number): Promise<void>;
  getGoalItemWithGoal(itemId: number): Promise<{ itemId: number; goalId: number; familyId: number; visibility: string; creatorId: string } | null>;

  getWishlists(familyId: number): Promise<(typeof wishlists.$inferSelect)[]>;
  getWishlist(id: number): Promise<typeof wishlists.$inferSelect | undefined>;
  createWishlist(data: any): Promise<typeof wishlists.$inferSelect>;
  updateWishlist(id: number, familyId: number, data: any): Promise<typeof wishlists.$inferSelect>;
  deleteWishlist(id: number, familyId: number): Promise<void>;

  getWishlistItems(wishlistId: number): Promise<(typeof wishlistItems.$inferSelect)[]>;
  createWishlistItem(data: any): Promise<typeof wishlistItems.$inferSelect>;
  updateWishlistItem(id: number, data: any): Promise<typeof wishlistItems.$inferSelect>;
  deleteWishlistItem(id: number): Promise<void>;
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

  async updateFinancialSchedule(id: number, familyId: number, data: Partial<typeof financialSchedule.$inferSelect>) {
    const [updated] = await db.update(financialSchedule).set(data).where(and(eq(financialSchedule.id, id), eq(financialSchedule.familyId, familyId))).returning();
    return updated;
  }

  async deleteFinancialSchedule(id: number, familyId: number) {
    await db.delete(financialSchedule).where(and(eq(financialSchedule.id, id), eq(financialSchedule.familyId, familyId)));
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

  async getGroceryLists(familyId: number, userId?: string) {
    const allLists = await db.select().from(groceryLists).where(eq(groceryLists.familyId, familyId));
    if (!userId) return allLists;
    return allLists.filter(list => !list.isPrivate || list.creatorId === userId);
  }

  async getGroceryList(id: number) {
    const [list] = await db.select().from(groceryLists).where(eq(groceryLists.id, id));
    return list || null;
  }

  async updateGroceryList(id: number, data: Partial<typeof groceryLists.$inferSelect>) {
    const [updated] = await db.update(groceryLists).set(data).where(eq(groceryLists.id, id)).returning();
    return updated;
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

  async updateGroceryItem(id: number, data: Partial<typeof groceryItems.$inferSelect>) {
    const [updated] = await db.update(groceryItems).set(data).where(eq(groceryItems.id, id)).returning();
    return updated;
  }

  async deleteGroceryItem(id: number) {
    await db.delete(groceryItems).where(eq(groceryItems.id, id));
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
      messageType: chatMessages.messageType,
      mediaUrl: chatMessages.mediaUrl,
      mediaDuration: chatMessages.mediaDuration,
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

  async getDiaryEntries(userId: string, familyId: number) {
    return await db.select().from(diaryEntries)
      .where(and(
        eq(diaryEntries.userId, userId),
        eq(diaryEntries.familyId, familyId),
        eq(diaryEntries.isDeleted, false)
      ))
      .orderBy(desc(diaryEntries.createdAt));
  }

  async getDiaryEntry(id: number) {
    const [entry] = await db.select().from(diaryEntries).where(eq(diaryEntries.id, id));
    return entry || null;
  }

  async createDiaryEntry(entry: InsertDiaryEntry) {
    const [newEntry] = await db.insert(diaryEntries).values(entry).returning();
    return newEntry;
  }

  async updateDiaryEntry(id: number, data: Partial<typeof diaryEntries.$inferSelect>) {
    const [updated] = await db.update(diaryEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(diaryEntries.id, id))
      .returning();
    return updated;
  }

  async softDeleteDiaryEntry(id: number) {
    const [updated] = await db.update(diaryEntries)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(diaryEntries.id, id))
      .returning();
    return updated;
  }

  async restoreDiaryEntry(id: number) {
    const [updated] = await db.update(diaryEntries)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(diaryEntries.id, id))
      .returning();
    return updated;
  }

  async getDeletedDiaryEntries(userId: string, familyId: number) {
    return await db.select().from(diaryEntries)
      .where(and(
        eq(diaryEntries.userId, userId),
        eq(diaryEntries.familyId, familyId),
        eq(diaryEntries.isDeleted, true)
      ))
      .orderBy(desc(diaryEntries.deletedAt));
  }

  async getDiarySettings(userId: string, familyId: number) {
    const [settings] = await db.select().from(diarySettings)
      .where(and(eq(diarySettings.userId, userId), eq(diarySettings.familyId, familyId)));
    return settings || null;
  }

  async upsertDiarySettings(userId: string, familyId: number, data: Partial<typeof diarySettings.$inferSelect>) {
    const existing = await this.getDiarySettings(userId, familyId);
    if (existing) {
      const [updated] = await db.update(diarySettings)
        .set(data)
        .where(eq(diarySettings.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(diarySettings)
      .values({ userId, familyId, ...data })
      .returning();
    return created;
  }

  async getMoodStats(userId: string, familyId: number) {
    const entries = await db.select({ mood: diaryEntries.mood, createdAt: diaryEntries.createdAt })
      .from(diaryEntries)
      .where(and(
        eq(diaryEntries.userId, userId),
        eq(diaryEntries.familyId, familyId),
        eq(diaryEntries.isDeleted, false)
      ))
      .orderBy(diaryEntries.createdAt);
    return entries;
  }

  async getGoalCategories(familyId: number) {
    return db.select().from(goalCategories).where(eq(goalCategories.familyId, familyId)).orderBy(goalCategories.name);
  }

  async createGoalCategory(data: any) {
    const [cat] = await db.insert(goalCategories).values(data).returning();
    return cat;
  }

  async deleteGoalCategory(id: number, familyId: number) {
    await db.delete(goalCategories).where(and(eq(goalCategories.id, id), eq(goalCategories.familyId, familyId)));
  }

  async getGoals(familyId: number) {
    return db.select().from(goals).where(eq(goals.familyId, familyId)).orderBy(desc(goals.updatedAt));
  }

  async getGoal(id: number) {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal;
  }

  async createGoal(data: any) {
    const [goal] = await db.insert(goals).values(data).returning();
    return goal;
  }

  async updateGoal(id: number, familyId: number, data: any) {
    const [updated] = await db.update(goals).set({ ...data, updatedAt: new Date() }).where(and(eq(goals.id, id), eq(goals.familyId, familyId))).returning();
    return updated;
  }

  async deleteGoal(id: number, familyId: number) {
    await db.delete(goalItems).where(eq(goalItems.goalId, id));
    await db.delete(goals).where(and(eq(goals.id, id), eq(goals.familyId, familyId)));
  }

  async getGoalItems(goalId: number) {
    return db.select().from(goalItems).where(eq(goalItems.goalId, goalId)).orderBy(asc(goalItems.sortOrder));
  }

  async createGoalItem(data: any) {
    const [item] = await db.insert(goalItems).values(data).returning();
    return item;
  }

  async updateGoalItem(id: number, data: any) {
    const [updated] = await db.update(goalItems).set(data).where(eq(goalItems.id, id)).returning();
    return updated;
  }

  async deleteGoalItem(id: number) {
    await db.delete(goalItems).where(eq(goalItems.id, id));
  }

  async getGoalItemWithGoal(itemId: number) {
    const [row] = await db
      .select({
        itemId: goalItems.id,
        goalId: goalItems.goalId,
        familyId: goals.familyId,
        visibility: goals.visibility,
        creatorId: goals.creatorId,
      })
      .from(goalItems)
      .innerJoin(goals, eq(goalItems.goalId, goals.id))
      .where(eq(goalItems.id, itemId));
    return row || null;
  }

  async getWishlists(familyId: number) {
    return db.select().from(wishlists).where(eq(wishlists.familyId, familyId)).orderBy(desc(wishlists.createdAt));
  }

  async getWishlist(id: number) {
    const [wl] = await db.select().from(wishlists).where(eq(wishlists.id, id));
    return wl;
  }

  async createWishlist(data: any) {
    const [wl] = await db.insert(wishlists).values(data).returning();
    return wl;
  }

  async updateWishlist(id: number, familyId: number, data: any) {
    const [updated] = await db.update(wishlists).set(data).where(and(eq(wishlists.id, id), eq(wishlists.familyId, familyId))).returning();
    return updated;
  }

  async deleteWishlist(id: number, familyId: number) {
    await db.delete(wishlistItems).where(eq(wishlistItems.wishlistId, id));
    await db.delete(wishlists).where(and(eq(wishlists.id, id), eq(wishlists.familyId, familyId)));
  }

  async getWishlistItems(wishlistId: number) {
    return db.select().from(wishlistItems).where(eq(wishlistItems.wishlistId, wishlistId)).orderBy(desc(wishlistItems.createdAt));
  }

  async createWishlistItem(data: any) {
    const [item] = await db.insert(wishlistItems).values(data).returning();
    return item;
  }

  async updateWishlistItem(id: number, data: any) {
    const [updated] = await db.update(wishlistItems).set(data).where(eq(wishlistItems.id, id)).returning();
    return updated;
  }

  async getWishlistItemWithWishlist(itemId: number) {
    const [row] = await db
      .select({
        itemId: wishlistItems.id,
        wishlistId: wishlistItems.wishlistId,
        claimedBy: wishlistItems.claimedBy,
        status: wishlistItems.status,
        familyId: wishlists.familyId,
        visibility: wishlists.visibility,
        creatorId: wishlists.creatorId,
      })
      .from(wishlistItems)
      .innerJoin(wishlists, eq(wishlistItems.wishlistId, wishlists.id))
      .where(eq(wishlistItems.id, itemId));
    return row || null;
  }

  async deleteWishlistItem(id: number) {
    await db.delete(wishlistItems).where(eq(wishlistItems.id, id));
  }

  async getLeaveTimeSettings(familyId: number, userId: string) {
    const [s] = await db.select().from(leaveTimeSettings).where(and(eq(leaveTimeSettings.familyId, familyId), eq(leaveTimeSettings.userId, userId)));
    return s || null;
  }

  async getLeaveTimeSettingsForFamily(familyId: number) {
    return db.select().from(leaveTimeSettings).where(eq(leaveTimeSettings.familyId, familyId));
  }

  async upsertLeaveTimeSettings(familyId: number, userId: string, data: any) {
    const existing = await this.getLeaveTimeSettings(familyId, userId);
    if (existing) {
      const [updated] = await db.update(leaveTimeSettings).set(data).where(eq(leaveTimeSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(leaveTimeSettings).values({ ...data, familyId, userId }).returning();
    return created;
  }

  async getLeaveTimeOverride(settingsId: number, date: string) {
    const [o] = await db.select().from(leaveTimeOverrides).where(and(eq(leaveTimeOverrides.settingsId, settingsId), eq(leaveTimeOverrides.date, date)));
    return o || null;
  }

  async upsertLeaveTimeOverride(settingsId: number, date: string, data: any) {
    const existing = await this.getLeaveTimeOverride(settingsId, date);
    if (existing) {
      const [updated] = await db.update(leaveTimeOverrides).set(data).where(eq(leaveTimeOverrides.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(leaveTimeOverrides).values({ ...data, settingsId, date }).returning();
    return created;
  }

  async deleteLeaveTimeOverride(settingsId: number, date: string) {
    await db.delete(leaveTimeOverrides).where(and(eq(leaveTimeOverrides.settingsId, settingsId), eq(leaveTimeOverrides.date, date)));
  }

  async getLeaveTimeTemplates(familyId: number, userId: string) {
    return db.select().from(leaveTimeTemplates).where(and(eq(leaveTimeTemplates.familyId, familyId), eq(leaveTimeTemplates.userId, userId))).orderBy(desc(leaveTimeTemplates.createdAt));
  }

  async createLeaveTimeTemplate(data: any) {
    const [t] = await db.insert(leaveTimeTemplates).values(data).returning();
    return t;
  }

  async deleteLeaveTimeTemplate(id: number, familyId: number, userId: string) {
    await db.delete(leaveTimeTemplates).where(and(eq(leaveTimeTemplates.id, id), eq(leaveTimeTemplates.familyId, familyId), eq(leaveTimeTemplates.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
