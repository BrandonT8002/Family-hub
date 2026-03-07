import { db } from "./db";
import {
  families, familyMembers, events, expenses, groceryLists, groceryItems, chatMessages, users,
  financialSchedule, savingsGoals, conversations, conversationParticipants, blocks,
  diaryEntries, diarySettings, goals, goalItems, goalCategories, wishlists, wishlistItems,
  leaveTimeSettings, leaveTimeOverrides, leaveTimeTemplates, caregivers, careNotes, familyInvites,
  familyConnections, academicClasses, academicEntries, workouts, snapshots,
  caregiverChecklists, userPreferences,
  type InsertFamily, type InsertEvent, type InsertExpense, type InsertGroceryList, type InsertGroceryItem, type InsertChatMessage, type InsertDiaryEntry,
  type Caregiver, type CareNote, type FamilyInvite,
  type FamilyConnection, type AcademicClass, type AcademicEntry, type Workout, type Snapshot
} from "@shared/schema";
import { eq, desc, and, or, ne, inArray, isNull, asc, sql } from "drizzle-orm";

export interface IStorage {
  getFamilyForUser(userId: string): Promise<typeof families.$inferSelect | null>;
  createFamily(name: string, ownerId: string): Promise<typeof families.$inferSelect>;
  updateFamily(id: number, data: Partial<typeof families.$inferSelect>): Promise<typeof families.$inferSelect>;

  getFamilyMembers(familyId: number): Promise<any[]>;
  getMemberRole(familyId: number, userId: string): Promise<string | null>;
  removeFamilyMember(id: number, familyId: number): Promise<void>;

  getEvents(familyId: number): Promise<any[]>;
  createEvent(event: InsertEvent): Promise<typeof events.$inferSelect>;
  updateEvent(id: number, familyId: number, userId: string, data: any): Promise<typeof events.$inferSelect>;
  deleteEvent(id: number, familyId: number, userId: string): Promise<void>;

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
  markConversationRead(conversationId: number, userId: string): Promise<void>;
  getUnreadCount(familyId: number, userId: string): Promise<number>;
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

  getCaregivers(familyId: number): Promise<Caregiver[]>;
  getCaregiverByUserId(familyId: number, userId: string): Promise<Caregiver | null>;
  getCaregiverById(id: number): Promise<Caregiver | null>;
  addCaregiver(data: any): Promise<Caregiver>;
  updateCaregiver(id: number, familyId: number, data: any): Promise<Caregiver>;
  revokeCaregiver(id: number, familyId: number): Promise<void>;

  getCareNotes(familyId: number, childId?: number): Promise<CareNote[]>;
  getCareNotesForCaregiver(caregiverId: number): Promise<CareNote[]>;
  createCareNote(data: any): Promise<CareNote>;

  createFamilyInvite(data: any): Promise<FamilyInvite>;
  getFamilyInvites(familyId: number): Promise<FamilyInvite[]>;
  getFamilyInviteByToken(token: string): Promise<FamilyInvite | null>;
  useFamilyInvite(token: string, userId: string): Promise<FamilyInvite>;
  revokeFamilyInvite(id: number, familyId: number): Promise<void>;
  addFamilyMember(familyId: number, userId: string, role: string, displayName?: string, dateOfBirth?: Date): Promise<any>;
  updateFamilyMember(id: number, familyId: number, data: any): Promise<any>;

  getFamilyConnections(familyId: number): Promise<FamilyConnection[]>;
  createFamilyConnection(data: any): Promise<FamilyConnection>;
  updateFamilyConnection(id: number, data: any): Promise<FamilyConnection>;
  deleteFamilyConnection(id: number): Promise<void>;
  getFamilyConnectionByFamilies(familyId1: number, familyId2: number): Promise<FamilyConnection | null>;

  getAcademicClasses(familyId: number, studentId?: string): Promise<AcademicClass[]>;
  createAcademicClass(data: any): Promise<AcademicClass>;
  updateAcademicClass(id: number, data: any): Promise<AcademicClass>;
  deleteAcademicClass(id: number, familyId: number): Promise<void>;
  getAcademicEntries(classId: number): Promise<AcademicEntry[]>;
  createAcademicEntry(data: any): Promise<AcademicEntry>;
  updateAcademicEntry(id: number, data: any): Promise<AcademicEntry>;
  deleteAcademicEntry(id: number): Promise<void>;

  getWorkouts(familyId: number, userId?: string): Promise<Workout[]>;
  createWorkout(data: any): Promise<Workout>;
  updateWorkout(id: number, data: any): Promise<Workout>;
  deleteWorkout(id: number, familyId: number): Promise<void>;

  getSnapshots(familyId: number, type?: string): Promise<Snapshot[]>;
  createSnapshot(data: any): Promise<Snapshot>;

  muteConversation(conversationId: number, userId: string, until: Date | null): Promise<void>;

  getCaregiverChecklists(familyId: number, caregiverId?: number): Promise<any[]>;
  createCaregiverChecklist(data: any): Promise<any>;
  updateCaregiverChecklist(id: number, data: any): Promise<any>;
  deleteCaregiverChecklist(id: number, familyId: number): Promise<void>;

  getUserPreferences(userId: string, familyId: number): Promise<any | null>;
  upsertUserPreferences(userId: string, familyId: number, data: any): Promise<any>;
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
        home: "#f8f9fa",
        schedule: "#f8f9fa",
        money: "#f8f9fa",
        groceries: "#f8f9fa",
        chat: "#f8f9fa",
        diary: "#f8f9fa",
        goals: "#f8f9fa",
        wishlists: "#f8f9fa",
        leaveTime: "#f8f9fa"
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

  async removeFamilyMember(id: number, familyId: number) {
    await db.delete(familyMembers).where(
      and(eq(familyMembers.id, id), eq(familyMembers.familyId, familyId))
    );
  }

  async getEvents(familyId: number) {
    const rows = await db.select({
      event: events,
      creatorDisplayName: familyMembers.displayName,
      creatorFirstName: users.firstName,
    })
      .from(events)
      .leftJoin(familyMembers, and(
        eq(familyMembers.userId, events.creatorId),
        eq(familyMembers.familyId, events.familyId)
      ))
      .leftJoin(users, eq(users.id, events.creatorId))
      .where(eq(events.familyId, familyId));
    return rows.map(r => ({
      ...r.event,
      creatorDisplayName: r.creatorDisplayName || r.creatorFirstName || null,
    }));
  }
  
  async createEvent(event: any) {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: number, familyId: number, userId: string, data: any) {
    const [existing] = await db.select().from(events).where(and(eq(events.id, id), eq(events.familyId, familyId)));
    if (!existing) throw new Error("Event not found");
    if (existing.creatorId !== userId) throw new Error("Only the creator can edit this event");
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.startTime !== undefined) updateData.startTime = data.startTime ? new Date(data.startTime) : null;
    if (data.endTime !== undefined) updateData.endTime = data.endTime ? new Date(data.endTime) : null;
    if (data.recurrence !== undefined) updateData.recurrence = data.recurrence;
    if (data.recurrenceDays !== undefined) updateData.recurrenceDays = data.recurrenceDays || null;
    if (data.recurrenceEnd !== undefined) updateData.recurrenceEnd = data.recurrenceEnd ? new Date(data.recurrenceEnd) : null;
    if (data.isPersonal !== undefined) updateData.isPersonal = data.isPersonal;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.location !== undefined) updateData.location = data.location;
    const [updated] = await db.update(events).set(updateData).where(eq(events.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: number, familyId: number, userId: string) {
    const [existing] = await db.select().from(events).where(and(eq(events.id, id), eq(events.familyId, familyId)));
    if (!existing) throw new Error("Event not found");
    if (existing.creatorId !== userId) throw new Error("Only the creator can delete this event");
    await db.delete(events).where(eq(events.id, id));
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
    const rows = await db.select({
      id: groceryItems.id,
      listId: groceryItems.listId,
      name: groceryItems.name,
      category: groceryItems.category,
      price: groceryItems.price,
      isChecked: groceryItems.isChecked,
      notes: groceryItems.notes,
      assignedTo: groceryItems.assignedTo,
      addedBy: groceryItems.addedBy,
      addedByDisplayName: familyMembers.displayName,
      addedByFirstName: users.firstName,
    })
    .from(groceryItems)
    .leftJoin(users, eq(groceryItems.addedBy, users.id))
    .leftJoin(familyMembers, and(
      eq(familyMembers.userId, groceryItems.addedBy),
      eq(familyMembers.familyId, sql`(SELECT family_id FROM grocery_lists WHERE id = ${groceryItems.listId})`)
    ))
    .where(eq(groceryItems.listId, listId));
    return rows.map(r => ({
      id: r.id,
      listId: r.listId,
      name: r.name,
      category: r.category,
      price: r.price,
      isChecked: r.isChecked,
      notes: r.notes,
      assignedTo: r.assignedTo,
      addedBy: r.addedBy,
      addedByName: r.addedByDisplayName || r.addedByFirstName || null,
    }));
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

      const participantRecord = row.conversation_participants;
      let unreadCount = 0;
      const unreadConditions = [
        eq(chatMessages.conversationId, conv.id),
        eq(chatMessages.isDeleted, false),
        sql`${chatMessages.senderId} != ${userId}`,
      ];
      if (participantRecord.lastReadAt) {
        unreadConditions.push(sql`${chatMessages.createdAt} > ${participantRecord.lastReadAt}`);
      }
      const [unreadResult] = await db.select({ count: sql<number>`count(*)::int` })
        .from(chatMessages)
        .where(and(...unreadConditions));
      unreadCount = unreadResult?.count || 0;

      result.push({
        ...conv,
        participants,
        lastMessage: lastMsg[0] || null,
        mutedUntil: participantRecord.mutedUntil,
        unreadCount,
      });
    }

    return result;
  }

  async markConversationRead(conversationId: number, userId: string) {
    await db.update(conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId)
        )
      );
  }

  async getUnreadCount(familyId: number, userId: string) {
    const participantRows = await db.select({
      conversationId: conversationParticipants.conversationId,
      lastReadAt: conversationParticipants.lastReadAt,
    })
      .from(conversationParticipants)
      .innerJoin(conversations, eq(conversationParticipants.conversationId, conversations.id))
      .where(
        and(
          eq(conversationParticipants.userId, userId),
          eq(conversations.familyId, familyId)
        )
      );

    let total = 0;
    for (const row of participantRows) {
      const conditions = [
        eq(chatMessages.conversationId, row.conversationId),
        eq(chatMessages.isDeleted, false),
        sql`${chatMessages.senderId} != ${userId}`,
      ];
      if (row.lastReadAt) {
        conditions.push(sql`${chatMessages.createdAt} > ${row.lastReadAt}`);
      }
      const [result] = await db.select({ count: sql<number>`count(*)::int` })
        .from(chatMessages)
        .where(and(...conditions));
      total += result?.count || 0;
    }
    return total;
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
      },
      displayName: familyMembers.displayName,
    })
    .from(chatMessages)
    .innerJoin(users, eq(chatMessages.senderId, users.id))
    .leftJoin(familyMembers, and(eq(familyMembers.userId, chatMessages.senderId), eq(familyMembers.familyId, chatMessages.familyId)))
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
      },
      displayName: familyMembers.displayName,
    })
    .from(chatMessages)
    .innerJoin(users, eq(chatMessages.senderId, users.id))
    .leftJoin(familyMembers, and(eq(familyMembers.userId, chatMessages.senderId), eq(familyMembers.familyId, chatMessages.familyId)))
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
    const rows = await db.select({
      goal: goals,
      creatorDisplayName: familyMembers.displayName,
      creatorFirstName: users.firstName,
      creatorProfileImage: users.profileImageUrl,
    })
    .from(goals)
    .leftJoin(familyMembers, and(
      eq(familyMembers.userId, goals.creatorId),
      eq(familyMembers.familyId, goals.familyId)
    ))
    .leftJoin(users, eq(users.id, goals.creatorId))
    .where(eq(goals.familyId, familyId))
    .orderBy(desc(goals.updatedAt));
    
    const result = [];
    for (const r of rows) {
      let lastUpdatedByName: string | null = null;
      if (r.goal.lastUpdatedBy) {
        const [updater] = await db.select({
          displayName: familyMembers.displayName,
          firstName: users.firstName,
        })
        .from(users)
        .leftJoin(familyMembers, and(
          eq(familyMembers.userId, users.id),
          eq(familyMembers.familyId, sql`${familyId}`)
        ))
        .where(eq(users.id, r.goal.lastUpdatedBy));
        lastUpdatedByName = updater?.displayName || updater?.firstName || null;
      }
      result.push({
        ...r.goal,
        creatorDisplayName: r.creatorDisplayName || r.creatorFirstName || null,
        creatorProfileImage: r.creatorProfileImage || null,
        lastUpdatedByName,
      });
    }
    return result;
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
    const updateData = { ...data, updatedAt: new Date() };
    const [updated] = await db.update(goals).set(updateData).where(and(eq(goals.id, id), eq(goals.familyId, familyId))).returning();
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

  async getCaregivers(familyId: number) {
    return db.select().from(caregivers).where(eq(caregivers.familyId, familyId)).orderBy(desc(caregivers.createdAt));
  }

  async getCaregiverByUserId(familyId: number, userId: string) {
    const [cg] = await db.select().from(caregivers).where(and(eq(caregivers.familyId, familyId), eq(caregivers.userId, userId), ne(caregivers.status, "revoked")));
    return cg || null;
  }

  async getCaregiverById(id: number) {
    const [cg] = await db.select().from(caregivers).where(eq(caregivers.id, id));
    return cg || null;
  }

  async addCaregiver(data: any) {
    const [cg] = await db.insert(caregivers).values(data).returning();
    return cg;
  }

  async updateCaregiver(id: number, familyId: number, data: any) {
    const [cg] = await db.update(caregivers).set(data).where(and(eq(caregivers.id, id), eq(caregivers.familyId, familyId))).returning();
    return cg;
  }

  async revokeCaregiver(id: number, familyId: number) {
    await db.update(caregivers).set({ status: "revoked" }).where(and(eq(caregivers.id, id), eq(caregivers.familyId, familyId)));
  }

  async getCareNotes(familyId: number, childId?: number) {
    if (childId) {
      return db.select().from(careNotes).where(and(eq(careNotes.familyId, familyId), eq(careNotes.childId, childId))).orderBy(desc(careNotes.noteTime));
    }
    return db.select().from(careNotes).where(eq(careNotes.familyId, familyId)).orderBy(desc(careNotes.noteTime));
  }

  async getCareNotesForCaregiver(caregiverId: number) {
    return db.select().from(careNotes).where(eq(careNotes.caregiverId, caregiverId)).orderBy(desc(careNotes.noteTime));
  }

  async createCareNote(data: any) {
    const [note] = await db.insert(careNotes).values(data).returning();
    return note;
  }

  async getFamilyForCaregiver(userId: string) {
    const [cg] = await db.select().from(caregivers).where(and(eq(caregivers.userId, userId), ne(caregivers.status, "revoked")));
    if (!cg) return null;
    const [family] = await db.select().from(families).where(eq(families.id, cg.familyId));
    return family || null;
  }

  async createFamilyInvite(data: any) {
    const [invite] = await db.insert(familyInvites).values(data).returning();
    return invite;
  }

  async getFamilyInvites(familyId: number) {
    return db.select().from(familyInvites).where(eq(familyInvites.familyId, familyId)).orderBy(desc(familyInvites.createdAt));
  }

  async getFamilyInviteByToken(token: string) {
    const [invite] = await db.select().from(familyInvites).where(eq(familyInvites.token, token));
    return invite || null;
  }

  async useFamilyInvite(token: string, userId: string) {
    const [invite] = await db.update(familyInvites)
      .set({ status: "used", usedBy: userId })
      .where(eq(familyInvites.token, token))
      .returning();
    return invite;
  }

  async revokeFamilyInvite(id: number, familyId: number) {
    await db.update(familyInvites)
      .set({ status: "revoked" })
      .where(and(eq(familyInvites.id, id), eq(familyInvites.familyId, familyId)));
  }

  async addFamilyMember(familyId: number, userId: string, role: string, displayName?: string, dateOfBirth?: Date) {
    const [member] = await db.insert(familyMembers).values({
      familyId,
      userId,
      role,
      displayName: displayName || null,
      dateOfBirth: dateOfBirth || null,
    }).returning();
    return member;
  }

  async updateFamilyMember(id: number, familyId: number, data: any) {
    const [member] = await db.update(familyMembers)
      .set(data)
      .where(and(eq(familyMembers.id, id), eq(familyMembers.familyId, familyId)))
      .returning();
    return member;
  }

  async getFamilyConnections(familyId: number) {
    return db.select().from(familyConnections)
      .where(or(
        eq(familyConnections.requestingFamilyId, familyId),
        eq(familyConnections.targetFamilyId, familyId)
      ))
      .orderBy(desc(familyConnections.createdAt));
  }

  async createFamilyConnection(data: any) {
    const [conn] = await db.insert(familyConnections).values(data).returning();
    return conn;
  }

  async updateFamilyConnection(id: number, data: any) {
    const [conn] = await db.update(familyConnections).set(data).where(eq(familyConnections.id, id)).returning();
    return conn;
  }

  async deleteFamilyConnection(id: number) {
    await db.delete(familyConnections).where(eq(familyConnections.id, id));
  }

  async getFamilyConnectionByFamilies(familyId1: number, familyId2: number) {
    const [conn] = await db.select().from(familyConnections)
      .where(or(
        and(eq(familyConnections.requestingFamilyId, familyId1), eq(familyConnections.targetFamilyId, familyId2)),
        and(eq(familyConnections.requestingFamilyId, familyId2), eq(familyConnections.targetFamilyId, familyId1))
      ));
    return conn || null;
  }

  async getAcademicClasses(familyId: number, studentId?: string) {
    if (studentId) {
      return db.select().from(academicClasses)
        .where(and(eq(academicClasses.familyId, familyId), eq(academicClasses.studentId, studentId)))
        .orderBy(desc(academicClasses.createdAt));
    }
    return db.select().from(academicClasses)
      .where(eq(academicClasses.familyId, familyId))
      .orderBy(desc(academicClasses.createdAt));
  }

  async createAcademicClass(data: any) {
    const [cls] = await db.insert(academicClasses).values(data).returning();
    return cls;
  }

  async updateAcademicClass(id: number, data: any) {
    const [cls] = await db.update(academicClasses).set(data).where(eq(academicClasses.id, id)).returning();
    return cls;
  }

  async deleteAcademicClass(id: number, familyId: number) {
    await db.delete(academicEntries).where(eq(academicEntries.classId, id));
    await db.delete(academicClasses).where(and(eq(academicClasses.id, id), eq(academicClasses.familyId, familyId)));
  }

  async getAcademicEntries(classId: number) {
    return db.select().from(academicEntries)
      .where(eq(academicEntries.classId, classId))
      .orderBy(desc(academicEntries.date));
  }

  async createAcademicEntry(data: any) {
    const [entry] = await db.insert(academicEntries).values(data).returning();
    return entry;
  }

  async updateAcademicEntry(id: number, data: any) {
    const [entry] = await db.update(academicEntries).set(data).where(eq(academicEntries.id, id)).returning();
    return entry;
  }

  async deleteAcademicEntry(id: number) {
    await db.delete(academicEntries).where(eq(academicEntries.id, id));
  }

  async getWorkouts(familyId: number, userId?: string) {
    if (userId) {
      return db.select().from(workouts)
        .where(and(eq(workouts.familyId, familyId), eq(workouts.userId, userId)))
        .orderBy(desc(workouts.date));
    }
    return db.select().from(workouts)
      .where(eq(workouts.familyId, familyId))
      .orderBy(desc(workouts.date));
  }

  async createWorkout(data: any) {
    const [w] = await db.insert(workouts).values(data).returning();
    return w;
  }

  async updateWorkout(id: number, data: any) {
    const [w] = await db.update(workouts).set(data).where(eq(workouts.id, id)).returning();
    return w;
  }

  async deleteWorkout(id: number, familyId: number) {
    await db.delete(workouts).where(and(eq(workouts.id, id), eq(workouts.familyId, familyId)));
  }

  async getSnapshots(familyId: number, type?: string) {
    if (type) {
      return db.select().from(snapshots)
        .where(and(eq(snapshots.familyId, familyId), eq(snapshots.type, type)))
        .orderBy(desc(snapshots.createdAt));
    }
    return db.select().from(snapshots)
      .where(eq(snapshots.familyId, familyId))
      .orderBy(desc(snapshots.createdAt));
  }

  async createSnapshot(data: any) {
    const [s] = await db.insert(snapshots).values(data).returning();
    return s;
  }

  async muteConversation(conversationId: number, userId: string, until: Date | null) {
    await db.update(conversationParticipants)
      .set({ mutedUntil: until })
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      ));
  }

  async getCaregiverChecklists(familyId: number, caregiverId?: number) {
    if (caregiverId) {
      return db.select().from(caregiverChecklists)
        .where(and(eq(caregiverChecklists.familyId, familyId), eq(caregiverChecklists.caregiverId, caregiverId)))
        .orderBy(desc(caregiverChecklists.createdAt));
    }
    return db.select().from(caregiverChecklists)
      .where(eq(caregiverChecklists.familyId, familyId))
      .orderBy(desc(caregiverChecklists.createdAt));
  }

  async createCaregiverChecklist(data: any) {
    const [c] = await db.insert(caregiverChecklists).values(data).returning();
    return c;
  }

  async updateCaregiverChecklist(id: number, data: any) {
    const [c] = await db.update(caregiverChecklists).set(data).where(eq(caregiverChecklists.id, id)).returning();
    return c;
  }

  async deleteCaregiverChecklist(id: number, familyId: number) {
    await db.delete(caregiverChecklists).where(and(eq(caregiverChecklists.id, id), eq(caregiverChecklists.familyId, familyId)));
  }

  async getUserPreferences(userId: string, familyId: number) {
    const [prefs] = await db.select().from(userPreferences)
      .where(and(eq(userPreferences.userId, userId), eq(userPreferences.familyId, familyId)));
    return prefs || null;
  }

  async upsertUserPreferences(userId: string, familyId: number, data: any) {
    const existing = await this.getUserPreferences(userId, familyId);
    if (existing) {
      const [updated] = await db.update(userPreferences)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(userPreferences.userId, userId), eq(userPreferences.familyId, familyId)))
        .returning();
      return updated;
    }
    const [created] = await db.insert(userPreferences)
      .values({ userId, familyId, ...data })
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
