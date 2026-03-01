import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { families, conversations, conversationParticipants } from "@shared/schema";
import { eq } from "drizzle-orm";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { authStorage } from "./replit_integrations/auth/storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import crypto from "crypto";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".bin";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^(image|video|audio)\//;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only image, video, and audio files are allowed"));
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.use("/uploads", express.static(uploadDir));

  app.post("/api/upload", isAuthenticated, upload.single("file"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const mimetype = req.file.mimetype;
    let messageType = "image";
    if (mimetype.startsWith("video/")) messageType = "video";
    else if (mimetype.startsWith("audio/")) messageType = "voice";
    res.json({
      url: `/uploads/${req.file.filename}`,
      messageType,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  });

  const requireFamily = async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const family = await storage.getFamilyForUser(userId);
    if (family) {
      req.family = family;
      req.isCaregiver = false;
      return next();
    }
    const cgFamily = await storage.getFamilyForCaregiver(userId);
    if (cgFamily) {
      req.family = cgFamily;
      req.isCaregiver = true;
      const cg = await storage.getCaregiverByUserId(cgFamily.id, userId);
      req.caregiverRecord = cg;
      return next();
    }
    return res.status(400).json({ message: "No family found" });
  };

  const requireOwner = async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (req.family.ownerId !== userId) return res.status(403).json({ message: "Only the family owner can do this" });
    next();
  };

  const blockCaregivers = (req: any, res: any, next: any) => {
    if (req.isCaregiver) return res.status(403).json({ message: "Caregivers do not have access to this feature" });
    next();
  };

  async function seedMoneyData(familyId: number, userId: string) {
    const existingExpenses = await storage.getExpenses(familyId);
    if (existingExpenses.length === 0) {
      await storage.createExpense({ familyId, creatorId: userId, amount: "45.50", category: "Groceries", vendor: "Costco", description: "Weekly run", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) });
      await storage.createExpense({ familyId, creatorId: userId, amount: "15.99", category: "Subscriptions", vendor: "Netflix", description: "Monthly sub", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) });
      await storage.createExpense({ familyId, creatorId: userId, amount: "120.00", category: "Utilities", vendor: "City Power", description: "Electric bill", date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) });
      
      await storage.createFinancialSchedule({ familyId, title: "Rent", amount: "2200.00", type: "Recurring", frequency: "Monthly", dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), isPayday: false });
      await storage.createFinancialSchedule({ familyId, title: "Payday", amount: "5000.00", type: "Recurring", frequency: "Bi-weekly", dueDate: new Date(), isPayday: true });
      
      await storage.createSavingsGoal({ familyId, name: "Emergency Fund", targetAmount: "10000", currentAmount: "2500" });
      await storage.createSavingsGoal({ familyId, name: "New Couch", targetAmount: "1500", currentAmount: "450" });
    }
  }

  // Family
  app.patch(api.family.get.path, isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const family = await storage.updateFamily(req.family.id, req.body);
      res.json(family);
    } catch (err) {
      res.status(500).json({ message: "Failed to update family" });
    }
  });

  app.get(api.family.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    let family = await storage.getFamilyForUser(userId);
    if (family) {
      await seedMoneyData(family.id, userId);
      return res.json(family);
    }
    family = await storage.getFamilyForCaregiver(userId);
    res.json(family);
  });

  app.post(api.family.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.family.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      const family = await storage.createFamily(input.name, userId);
      if (input.themeConfig || input.fontFamily) {
        await storage.updateFamily(family.id, { 
          themeConfig: input.themeConfig, 
          fontFamily: input.fontFamily 
        });
      }
      res.status(201).json(family);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Family Members
  app.get(api.familyMembers.list.path, isAuthenticated, requireFamily, async (req: any, res) => {
    const members = await storage.getFamilyMembers(req.family.id);
    res.json(members);
  });

  app.delete('/api/family/members/:id', isAuthenticated, requireFamily, requireOwner, async (req: any, res) => {
    try {
      const memberId = Number(req.params.id);
      const members = await storage.getFamilyMembers(req.family.id);
      const member = members.find((m: any) => m.id === memberId);
      if (!member) return res.status(404).json({ message: "Member not found" });
      if (member.role === "Owner") return res.status(400).json({ message: "Cannot remove the family owner" });
      await storage.removeFamilyMember(memberId, req.family.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to remove member" });
    }
  });

  app.patch('/api/family/tier', isAuthenticated, requireFamily, requireOwner, async (req: any, res) => {
    try {
      const { tier } = req.body;
      const { FAMILY_TIERS } = await import("@shared/schema");
      if (!tier || !(tier in FAMILY_TIERS)) return res.status(400).json({ message: "Invalid tier" });
      const tierConfig = FAMILY_TIERS[tier as keyof typeof FAMILY_TIERS];
      const members = await storage.getFamilyMembers(req.family.id);
      const caregiversList = await storage.getCaregivers(req.family.id);
      const activeMembers = members.length;
      const activeCaregivers = caregiversList.filter((c: any) => c.status !== "revoked").length;

      if (activeMembers > tierConfig.maxMembers) {
        return res.status(400).json({ message: `Cannot downgrade: you have ${activeMembers} members but ${tierConfig.label} allows ${tierConfig.maxMembers}. Remove members first.` });
      }
      if (activeCaregivers > tierConfig.maxCaregivers) {
        return res.status(400).json({ message: `Cannot downgrade: you have ${activeCaregivers} caregivers but ${tierConfig.label} allows ${tierConfig.maxCaregivers}. Revoke caregivers first.` });
      }

      const updated = await storage.updateFamily(req.family.id, { tier } as any);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update tier" });
    }
  });

  // Events
  app.get(api.events.list.path, isAuthenticated, requireFamily, async (req: any, res) => {
    const events = await storage.getEvents(req.family.id);
    res.json(events);
  });

  app.post(api.events.create.path, isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const input = api.events.create.input.parse(req.body);
      const event = await storage.createEvent({
        ...input,
        date: new Date(input.date),
        startTime: input.startTime ? new Date(input.startTime) : null,
        endTime: input.endTime ? new Date(input.endTime) : null,
        familyId: req.family.id,
        creatorId: req.user.claims.sub,
        recurrence: input.recurrence || "One-time",
        isPersonal: !!input.isPersonal,
        notes: input.notes || null,
        location: input.location || null,
      });
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Expenses
  app.get(api.expenses.list.path, isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    const expenses = await storage.getExpenses(req.family.id);
    res.json(expenses);
  });

  app.post(api.expenses.create.path, isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const input = api.expenses.create.input.parse(req.body);
      const expense = await storage.createExpense({
        ...input,
        amount: input.amount.toString(),
        familyId: req.family.id,
        creatorId: req.user.claims.sub,
        date: input.date ? new Date(input.date) : new Date(),
      });
      res.status(201).json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Financial Schedule
  app.get(api.financialSchedule.list.path, isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    const schedule = await storage.getFinancialSchedule(req.family.id);
    res.json(schedule);
  });

  app.post(api.financialSchedule.create.path, isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const input = api.financialSchedule.create.input.parse(req.body);
      const parsedDate = new Date(input.dueDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid due date" });
      }
      const item = await storage.createFinancialSchedule({
        ...input,
        amount: input.amount.toString(),
        dueDate: parsedDate,
        familyId: req.family.id,
        creatorId: req.user.claims.sub,
      });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  const updateFinancialScheduleSchema = z.object({
    title: z.string().optional(),
    amount: z.number().or(z.string()).optional(),
    type: z.string().optional(),
    frequency: z.string().optional(),
    dueDate: z.string().optional(),
    isPayday: z.boolean().optional(),
    billType: z.string().optional(),
    category: z.string().optional(),
    notes: z.string().optional(),
    isPaid: z.boolean().optional(),
    autoPay: z.boolean().optional(),
    reminderDays: z.number().optional(),
  });

  app.patch('/api/financial-schedule/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const input = updateFinancialScheduleSchema.parse(req.body);
      
      const updates: any = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.amount !== undefined) updates.amount = input.amount.toString();
      if (input.type !== undefined) updates.type = input.type;
      if (input.frequency !== undefined) updates.frequency = input.frequency;
      if (input.dueDate !== undefined) {
        const parsedDate = new Date(input.dueDate);
        if (isNaN(parsedDate.getTime())) return res.status(400).json({ message: "Invalid due date" });
        updates.dueDate = parsedDate;
      }
      if (input.isPayday !== undefined) updates.isPayday = input.isPayday;
      if (input.billType !== undefined) updates.billType = input.billType;
      if (input.category !== undefined) updates.category = input.category;
      if (input.notes !== undefined) updates.notes = input.notes;
      if (input.isPaid !== undefined) updates.isPaid = input.isPaid;
      if (input.autoPay !== undefined) updates.autoPay = input.autoPay;
      if (input.reminderDays !== undefined) updates.reminderDays = input.reminderDays;
      
      const updated = await storage.updateFinancialSchedule(id, req.family.id, updates);
      if (!updated) return res.status(404).json({ message: "Item not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  app.delete('/api/financial-schedule/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteFinancialSchedule(id, req.family.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Savings Goals
  app.get(api.savingsGoals.list.path, isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    const goals = await storage.getSavingsGoals(req.family.id);
    res.json(goals);
  });

  app.post(api.savingsGoals.create.path, isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const input = api.savingsGoals.create.input.parse(req.body);
      const goal = await storage.createSavingsGoal({
        ...input,
        targetAmount: input.targetAmount.toString(),
        currentAmount: input.currentAmount?.toString() || "0",
        familyId: req.family.id,
      });
      res.status(201).json(goal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.savingsGoals.update.path, isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const input = api.savingsGoals.update.input.parse(req.body);
      const goal = await storage.updateSavingsGoal(Number(req.params.id), input.currentAmount.toString());
      res.json(goal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Groceries
  app.get(api.groceryLists.list.path, isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const lists = await storage.getGroceryLists(req.family.id, userId);
    res.json(lists);
  });

  app.post(api.groceryLists.create.path, isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const input = api.groceryLists.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      const list = await storage.createGroceryList({
        ...input,
        familyId: req.family.id,
        creatorId: userId,
        storeName: (req.body as any).storeName || null,
        listCategory: (req.body as any).listCategory || "Groceries",
        type: input.type || "Needs",
        isPrivate: (req.body as any).isPrivate || false,
      });
      res.status(201).json(list);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch('/api/grocery-lists/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const userId = req.user.claims.sub;
      const list = await storage.getGroceryList(id);
      if (!list) return res.status(404).json({ message: "List not found" });
      if (list.familyId !== req.family.id) return res.status(403).json({ message: "Access denied" });
      if (list.creatorId && list.creatorId !== userId) return res.status(403).json({ message: "Only the list creator can change privacy" });
      const input = z.object({ isPrivate: z.boolean() }).parse(req.body);
      const updated = await storage.updateGroceryList(id, { isPrivate: input.isPrivate });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to update list" });
    }
  });

  app.get(api.groceryItems.list.path, isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    const listId = Number(req.params.listId);
    const userId = req.user.claims.sub;
    const list = await storage.getGroceryList(listId);
    if (!list) return res.status(404).json({ message: "List not found" });
    if (list.familyId !== req.family.id) return res.status(403).json({ message: "Access denied" });
    if (list.isPrivate && list.creatorId !== userId) return res.status(403).json({ message: "This is a private list" });
    const items = await storage.getGroceryItems(listId);
    res.json(items);
  });

  app.post(api.groceryItems.create.path, isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const input = api.groceryItems.create.input.parse(req.body);
      const item = await storage.createGroceryItem({
        ...input,
        listId: Number(req.params.listId),
        price: input.price?.toString() || "0",
        notes: (req.body as any).notes || null,
        assignedTo: (req.body as any).assignedTo || null,
      });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.groceryItems.toggle.path, isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const input = api.groceryItems.toggle.input.parse(req.body);
      const item = await storage.toggleGroceryItem(Number(req.params.id), input.isChecked);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.groceryItems.update.path, isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const input = api.groceryItems.update.input.parse(req.body);
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.price !== undefined) updateData.price = input.price.toString();
      if (input.notes !== undefined) updateData.notes = input.notes;
      const item = await storage.updateGroceryItem(Number(req.params.id), updateData);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.groceryItems.remove.path, isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      await storage.deleteGroceryItem(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Conversations
  app.get(api.conversations.list.path, isAuthenticated, requireFamily, async (req: any, res) => {
    const userId = req.user.claims.sub;

    if (req.isCaregiver) {
      const perms = (req.caregiverRecord?.permissions as any) || {};
      if (!perms.chatEnabled) return res.json([]);
      const convs = await storage.getConversationsForUser(req.family.id, userId);
      const dmOnly = convs.filter((c: any) => c.type === "dm");
      return res.json(dmOnly);
    }

    await storage.getOrCreateGroupConversation(req.family.id);
    const convs = await storage.getConversationsForUser(req.family.id, userId);
    res.json(convs);
  });

  app.post(api.conversations.createDM.path, isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const input = api.conversations.createDM.input.parse(req.body);
      const userId = req.user.claims.sub;

      if (req.isCaregiver) {
        const perms = (req.caregiverRecord?.permissions as any) || {};
        if (!perms.chatEnabled) return res.status(403).json({ message: "Chat is not enabled for your caregiver access" });
        const members = await storage.getFamilyMembers(req.family.id);
        const recipient = members.find((m: any) => m.userId === input.recipientId);
        if (!recipient || !["Adult", "Owner"].includes(recipient.role)) {
          return res.status(403).json({ message: "Caregivers can only message adult family members" });
        }
      }
      
      const blocked = await storage.isBlocked(userId, input.recipientId, req.family.id);
      if (blocked) {
        return res.status(400).json({ message: "Cannot message this user" });
      }

      const conv = await storage.createDMConversation(req.family.id, userId, input.recipientId);
      res.status(201).json(conv);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  const requireConversationAccess = async (req: any, res: any) => {
    const convId = Number(req.params.id);
    const userId = req.user.claims.sub;
    const conv = await storage.getConversation(convId);
    if (!conv) { res.status(404).json({ message: "Conversation not found" }); return null; }
    if (conv.familyId !== req.family.id) { res.status(403).json({ message: "Access denied" }); return null; }
    const convos = await storage.getConversationsForUser(req.family.id, userId);
    const hasAccess = convos.some((c: any) => c.id === convId);
    if (!hasAccess) { res.status(403).json({ message: "Access denied" }); return null; }
    return conv;
  };

  app.patch('/api/conversations/:id/accept', isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const conv = await requireConversationAccess(req, res);
      if (!conv) return;
      const updated = await storage.acceptConversation(conv.id);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to accept conversation" });
    }
  });

  app.get('/api/conversations/:id/messages', isAuthenticated, requireFamily, async (req: any, res) => {
    const conv = await requireConversationAccess(req, res);
    if (!conv) return;
    const messages = await storage.getChatMessages(conv.id);
    res.json(messages);
  });

  app.post('/api/conversations/:id/messages', isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const input = api.conversations.sendMessage.input.parse(req.body);
      const userId = req.user.claims.sub;
      const conv = await requireConversationAccess(req, res);
      if (!conv) return;

      if (conv.type === "dm") {
        const convos = await storage.getConversationsForUser(req.family.id, userId);
        const fullConv = convos.find((c: any) => c.id === conv.id);
        const otherUser = fullConv?.participants?.find((p: any) => p.userId !== userId);
        if (otherUser) {
          const blocked = await storage.isBlocked(userId, otherUser.userId, req.family.id);
          if (blocked) return res.status(400).json({ message: "Cannot message this user" });
        }
      }

      if (conv.status === "pending" && conv.createdBy === userId) {
        // Creator can send messages to pending conversations
      } else if (conv.status === "pending") {
        return res.status(400).json({ message: "You must accept this conversation request first" });
      }

      const mediaSchema = z.object({
        messageType: z.enum(["text", "image", "video", "voice"]).optional().default("text"),
        mediaUrl: z.string().startsWith("/uploads/").nullable().optional(),
        mediaDuration: z.number().int().min(0).max(3600).nullable().optional(),
      });
      const mediaInput = mediaSchema.parse(req.body);

      const msg = await storage.createChatMessage({
        conversationId: conv.id,
        familyId: req.family.id,
        senderId: userId,
        content: input.content,
        messageType: mediaInput.messageType,
        mediaUrl: mediaInput.mediaUrl || null,
        mediaDuration: mediaInput.mediaDuration || null,
      });
      res.status(201).json(msg);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete('/api/messages/:id', isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteMessage(Number(req.params.id), userId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Blocks
  app.get(api.blocks.list.path, isAuthenticated, requireFamily, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const blocksList = await storage.getBlocks(userId, req.family.id);
    res.json(blocksList);
  });

  app.post(api.blocks.create.path, isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const input = api.blocks.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      const block = await storage.blockUser(userId, input.blockedId, req.family.id);
      res.status(201).json(block);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete('/api/blocks/:blockedId', isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.unblockUser(userId, req.params.blockedId, req.family.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });

  // Legacy chat endpoints (backward compatibility - only returns group chat messages)
  app.get(api.chat.list.path, isAuthenticated, requireFamily, async (req: any, res) => {
    const groupConv = await storage.getOrCreateGroupConversation(req.family.id);
    const msgs = await storage.getChatMessages(groupConv.id);
    res.json(msgs);
  });

  app.post(api.chat.create.path, isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const input = api.chat.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      
      const groupConv = await storage.getOrCreateGroupConversation(req.family.id);

      const msg = await storage.createChatMessage({
        conversationId: groupConv.id,
        content: input.content,
        familyId: req.family.id,
        senderId: userId,
      });
      res.status(201).json(msg);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Diary
  app.get('/api/diary', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const entries = await storage.getDiaryEntries(userId, req.family.id);
    res.json(entries);
  });

  app.get('/api/diary/deleted', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const entries = await storage.getDeletedDiaryEntries(userId, req.family.id);
    res.json(entries);
  });

  app.get('/api/diary/mood-stats', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const stats = await storage.getMoodStats(userId, req.family.id);
    res.json(stats);
  });

  app.get('/api/diary/settings', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const settings = await storage.getDiarySettings(userId, req.family.id);
    res.json(settings);
  });

  app.patch('/api/diary/settings', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = z.object({
        diaryPin: z.string().min(4).max(6).optional(),
        isLocked: z.boolean().optional(),
        weeklyReflectionEnabled: z.boolean().optional(),
      }).parse(req.body);
      const settings = await storage.upsertDiarySettings(userId, req.family.id, input);
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.post('/api/diary/verify-pin', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { pin } = z.object({ pin: z.string() }).parse(req.body);
      const settings = await storage.getDiarySettings(userId, req.family.id);
      if (!settings || !settings.diaryPin) return res.json({ valid: true });
      res.json({ valid: settings.diaryPin === pin });
    } catch (err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.get('/api/diary/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const entry = await storage.getDiaryEntry(Number(req.params.id));
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    if (entry.userId !== userId) {
      if (!entry.sharedWith?.includes(userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    res.json(entry);
  });

  app.post('/api/diary', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = z.object({
        title: z.string().optional(),
        body: z.string().min(1),
        mood: z.string().optional(),
        tags: z.array(z.string()).optional(),
        photoUrls: z.array(z.string()).optional(),
        isPrivate: z.boolean().optional().default(true),
      }).parse(req.body);
      const entry = await storage.createDiaryEntry({
        ...input,
        userId,
        familyId: req.family.id,
        tags: input.tags || null,
        photoUrls: input.photoUrls || null,
        sharedWith: null,
      });
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to create entry" });
    }
  });

  app.patch('/api/diary/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entry = await storage.getDiaryEntry(Number(req.params.id));
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      if (entry.userId !== userId) return res.status(403).json({ message: "Access denied" });
      const input = z.object({
        title: z.string().nullable().optional(),
        body: z.string().min(1).optional(),
        mood: z.string().nullable().optional(),
        tags: z.array(z.string()).nullable().optional(),
        photoUrls: z.array(z.string()).nullable().optional(),
        isPrivate: z.boolean().optional(),
        sharedWith: z.array(z.string()).nullable().optional(),
      }).parse(req.body);
      const updated = await storage.updateDiaryEntry(entry.id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to update entry" });
    }
  });

  app.delete('/api/diary/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entry = await storage.getDiaryEntry(Number(req.params.id));
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      if (entry.userId !== userId) return res.status(403).json({ message: "Access denied" });
      await storage.softDeleteDiaryEntry(entry.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete entry" });
    }
  });

  app.patch('/api/diary/:id/restore', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entry = await storage.getDiaryEntry(Number(req.params.id));
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      if (entry.userId !== userId) return res.status(403).json({ message: "Access denied" });
      const restored = await storage.restoreDiaryEntry(entry.id);
      res.json(restored);
    } catch (err) {
      res.status(500).json({ message: "Failed to restore entry" });
    }
  });

  // ── Goals ──

  app.get('/api/goals/categories', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const categories = await storage.getGoalCategories(req.family.id);
      res.json(categories);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/goals/categories', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const { name, icon, color } = req.body;
      if (!name) return res.status(400).json({ message: "Name is required" });
      const cat = await storage.createGoalCategory({ familyId: req.family.id, name, icon: icon || null, color: color || null });
      res.json(cat);
    } catch (err: any) {
      console.error("Category creation error:", err.message || err);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.delete('/api/goals/categories/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      await storage.deleteGoalCategory(Number(req.params.id), req.family.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  app.get('/api/goals', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const allGoals = await storage.getGoals(req.family.id);
      const userId = req.user.claims.sub;
      const visible = allGoals.filter((g: any) => {
        if (g.visibility === "family") return true;
        if (g.creatorId === userId) return true;
        return false;
      });
      res.json(visible);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post('/api/goals', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description, categoryId, type, progressType, visibility, targetValue, unit, dueDate, linkedSavingsGoalId } = req.body;
      if (!title) return res.status(400).json({ message: "Title is required" });
      const goal = await storage.createGoal({
        familyId: req.family.id,
        creatorId: userId,
        title,
        description: description || null,
        categoryId: categoryId || null,
        type: type || "short-term",
        progressType: progressType || "checklist",
        visibility: visibility || "personal",
        status: "active",
        targetValue: targetValue || null,
        currentValue: "0",
        unit: unit || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        linkedSavingsGoalId: linkedSavingsGoalId || null,
      });
      res.json(goal);
    } catch (err) {
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  app.patch('/api/goals/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goal = await storage.getGoal(Number(req.params.id));
      if (!goal || goal.familyId !== req.family.id) return res.status(404).json({ message: "Goal not found" });
      if (goal.visibility === "personal" && goal.creatorId !== userId) return res.status(403).json({ message: "Access denied" });
      const updated = await storage.updateGoal(goal.id, req.family.id, req.body);
      if (!updated) return res.status(404).json({ message: "Goal not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update goal" });
    }
  });

  app.delete('/api/goals/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goal = await storage.getGoal(Number(req.params.id));
      if (!goal || goal.familyId !== req.family.id) return res.status(404).json({ message: "Goal not found" });
      if (goal.visibility === "personal" && goal.creatorId !== userId) return res.status(403).json({ message: "Access denied" });
      await storage.deleteGoal(goal.id, req.family.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  app.get('/api/goals/:id/items', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const goal = await storage.getGoal(Number(req.params.id));
      if (!goal || goal.familyId !== req.family.id) return res.status(404).json({ message: "Goal not found" });
      const userId = req.user.claims.sub;
      if (goal.visibility === "personal" && goal.creatorId !== userId) return res.status(403).json({ message: "Access denied" });
      const items = await storage.getGoalItems(goal.id);
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.post('/api/goals/:id/items', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const goal = await storage.getGoal(Number(req.params.id));
      if (!goal || goal.familyId !== req.family.id) return res.status(404).json({ message: "Goal not found" });
      const userId = req.user.claims.sub;
      if (goal.visibility === "personal" && goal.creatorId !== userId) return res.status(403).json({ message: "Access denied" });
      const { title, sortOrder } = req.body;
      if (!title) return res.status(400).json({ message: "Title is required" });
      const item = await storage.createGoalItem({ goalId: goal.id, title, sortOrder: sortOrder || 0 });
      res.json(item);
    } catch (err) {
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  app.patch('/api/goals/items/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const item = await storage.getGoalItemWithGoal(Number(req.params.id));
      if (!item || item.familyId !== req.family.id) return res.status(404).json({ message: "Item not found" });
      const userId = req.user.claims.sub;
      if (item.visibility === "personal" && item.creatorId !== userId) return res.status(403).json({ message: "Access denied" });
      const updated = await storage.updateGoalItem(item.itemId, req.body);
      if (!updated) return res.status(404).json({ message: "Item not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  app.delete('/api/goals/items/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const item = await storage.getGoalItemWithGoal(Number(req.params.id));
      if (!item || item.familyId !== req.family.id) return res.status(404).json({ message: "Item not found" });
      const userId = req.user.claims.sub;
      if (item.visibility === "personal" && item.creatorId !== userId) return res.status(403).json({ message: "Access denied" });
      await storage.deleteGoalItem(item.itemId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // ── Wishlists ──

  app.get('/api/wishlists', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const all = await storage.getWishlists(req.family.id);
      const visible = all.filter((w: any) => {
        if (w.visibility === "family") return true;
        if (w.creatorId === userId) return true;
        return false;
      });
      res.json(visible);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch wishlists" });
    }
  });

  app.post('/api/wishlists', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, description, visibility, hideClaimedBy } = req.body;
      if (!name) return res.status(400).json({ message: "Name is required" });
      const wl = await storage.createWishlist({
        familyId: req.family.id,
        creatorId: userId,
        name,
        description: description || null,
        visibility: visibility || "family",
        hideClaimedBy: hideClaimedBy !== false,
      });
      res.json(wl);
    } catch (err) {
      res.status(500).json({ message: "Failed to create wishlist" });
    }
  });

  app.patch('/api/wishlists/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wl = await storage.getWishlist(Number(req.params.id));
      if (!wl || wl.familyId !== req.family.id) return res.status(404).json({ message: "Not found" });
      if (wl.creatorId !== userId) return res.status(403).json({ message: "Access denied" });
      const updated = await storage.updateWishlist(wl.id, req.family.id, req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update wishlist" });
    }
  });

  app.delete('/api/wishlists/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wl = await storage.getWishlist(Number(req.params.id));
      if (!wl || wl.familyId !== req.family.id) return res.status(404).json({ message: "Not found" });
      if (wl.creatorId !== userId) return res.status(403).json({ message: "Access denied" });
      await storage.deleteWishlist(wl.id, req.family.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete wishlist" });
    }
  });

  app.get('/api/wishlists/:id/items', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wl = await storage.getWishlist(Number(req.params.id));
      if (!wl || wl.familyId !== req.family.id) return res.status(404).json({ message: "Not found" });
      if (wl.visibility === "private" && wl.creatorId !== userId) return res.status(403).json({ message: "Access denied" });
      const items = await storage.getWishlistItems(wl.id);
      const isOwner = wl.creatorId === userId;
      const safeItems = items.map((item: any) => ({
        ...item,
        claimedBy: (wl.hideClaimedBy && isOwner) ? null : item.claimedBy,
        claimedNote: (wl.hideClaimedBy && isOwner) ? null : item.claimedNote,
      }));
      res.json(safeItems);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.post('/api/wishlists/:id/items', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wl = await storage.getWishlist(Number(req.params.id));
      if (!wl || wl.familyId !== req.family.id) return res.status(404).json({ message: "Not found" });
      if (wl.creatorId !== userId) return res.status(403).json({ message: "Only the list owner can add items" });
      const { name, category, estimatedPrice, storeName, storeLink, notes, priority, wantOrNeed } = req.body;
      if (!name) return res.status(400).json({ message: "Name is required" });
      const item = await storage.createWishlistItem({
        wishlistId: wl.id,
        name,
        category: category || null,
        estimatedPrice: estimatedPrice || null,
        storeName: storeName || null,
        storeLink: storeLink || null,
        notes: notes || null,
        priority: priority || "medium",
        wantOrNeed: wantOrNeed || "want",
      });
      res.json(item);
    } catch (err) {
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  app.patch('/api/wishlists/items/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itemInfo = await storage.getWishlistItemWithWishlist(Number(req.params.id));
      if (!itemInfo || itemInfo.familyId !== req.family.id) return res.status(404).json({ message: "Item not found" });
      if (itemInfo.visibility === "private" && itemInfo.creatorId !== userId) return res.status(403).json({ message: "Access denied" });

      const isOwner = itemInfo.creatorId === userId;
      const { status, claimedBy, claimedNote, ...otherFields } = req.body;

      if (isOwner) {
        const safeData: any = {};
        if (otherFields.name !== undefined) safeData.name = otherFields.name;
        if (otherFields.category !== undefined) safeData.category = otherFields.category;
        if (otherFields.estimatedPrice !== undefined) safeData.estimatedPrice = otherFields.estimatedPrice;
        if (otherFields.storeName !== undefined) safeData.storeName = otherFields.storeName;
        if (otherFields.storeLink !== undefined) safeData.storeLink = otherFields.storeLink;
        if (otherFields.notes !== undefined) safeData.notes = otherFields.notes;
        if (otherFields.priority !== undefined) safeData.priority = otherFields.priority;
        if (otherFields.wantOrNeed !== undefined) safeData.wantOrNeed = otherFields.wantOrNeed;
        const updated = await storage.updateWishlistItem(Number(req.params.id), safeData);
        return res.json(updated);
      }

      const claimData: any = {};
      if (status === "claimed") {
        claimData.status = "claimed";
        claimData.claimedBy = userId;
        if (claimedNote) claimData.claimedNote = claimedNote;
      } else if (status === "unclaimed" && itemInfo.claimedBy === userId) {
        claimData.status = "unclaimed";
        claimData.claimedBy = null;
        claimData.claimedNote = null;
      } else if (status === "purchased" && itemInfo.claimedBy === userId) {
        claimData.status = "purchased";
      } else {
        return res.status(403).json({ message: "You can only claim/unclaim/purchase items" });
      }
      const updated = await storage.updateWishlistItem(Number(req.params.id), claimData);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  app.delete('/api/wishlists/items/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const itemInfo = await storage.getWishlistItemWithWishlist(Number(req.params.id));
      if (!itemInfo || itemInfo.familyId !== req.family.id) return res.status(404).json({ message: "Item not found" });
      if (itemInfo.creatorId !== userId) return res.status(403).json({ message: "Only the list owner can delete items" });
      await storage.deleteWishlistItem(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // ── Leave Time ──

  app.get('/api/leave-time/settings', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getLeaveTimeSettings(req.family.id, userId);
      res.json(settings);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch leave time settings" });
    }
  });

  app.put('/api/leave-time/settings', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isEnabled, schedule, reminderMinutes, visibility, showOnDashboard, checklistEnabled, defaultChecklist } = req.body;
      const settings = await storage.upsertLeaveTimeSettings(req.family.id, userId, {
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        schedule: schedule || null,
        reminderMinutes: reminderMinutes || 10,
        visibility: visibility || "private",
        showOnDashboard: showOnDashboard !== undefined ? showOnDashboard : true,
        checklistEnabled: checklistEnabled !== undefined ? checklistEnabled : true,
        defaultChecklist: defaultChecklist || null,
      });
      res.json(settings);
    } catch (err) {
      res.status(500).json({ message: "Failed to save leave time settings" });
    }
  });

  app.get('/api/leave-time/today', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getLeaveTimeSettings(req.family.id, userId);
      if (!settings || !settings.isEnabled) return res.json({ hasLeaveTime: false });

      const today = new Date().toISOString().split('T')[0];
      const override = await storage.getLeaveTimeOverride(settings.id, today);

      if (override?.isSkipped) return res.json({ hasLeaveTime: false, skipped: true });

      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const dayKey = dayNames[new Date().getDay()];
      const scheduleTime = (settings.schedule as any)?.[dayKey] || null;
      const leaveTime = override?.leaveTime || scheduleTime;

      if (!leaveTime) return res.json({ hasLeaveTime: false, noTimeSet: true });

      const checklist = override?.customChecklist || settings.defaultChecklist || [];

      res.json({
        hasLeaveTime: true,
        leaveTime,
        checklist,
        reminderMinutes: settings.reminderMinutes,
        showOnDashboard: settings.showOnDashboard,
        checklistEnabled: settings.checklistEnabled,
        isOverride: !!override?.leaveTime,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch today's leave time" });
    }
  });

  app.put('/api/leave-time/override', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getLeaveTimeSettings(req.family.id, userId);
      if (!settings) return res.status(404).json({ message: "No leave time settings found" });

      const { date, leaveTime, isSkipped, customChecklist } = req.body;
      if (!date) return res.status(400).json({ message: "Date is required" });

      const override = await storage.upsertLeaveTimeOverride(settings.id, date, {
        leaveTime: leaveTime || null,
        isSkipped: isSkipped || false,
        customChecklist: customChecklist || null,
      });
      res.json(override);
    } catch (err) {
      res.status(500).json({ message: "Failed to save override" });
    }
  });

  app.delete('/api/leave-time/override/:date', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getLeaveTimeSettings(req.family.id, userId);
      if (!settings) return res.status(404).json({ message: "No leave time settings found" });
      await storage.deleteLeaveTimeOverride(settings.id, req.params.date);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete override" });
    }
  });

  app.get('/api/leave-time/templates', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templates = await storage.getLeaveTimeTemplates(req.family.id, userId);
      res.json(templates);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post('/api/leave-time/templates', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, items } = req.body;
      if (!name || !items?.length) return res.status(400).json({ message: "Name and items are required" });
      const template = await storage.createLeaveTimeTemplate({ familyId: req.family.id, userId, name, items });
      res.json(template);
    } catch (err) {
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.delete('/api/leave-time/templates/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteLeaveTimeTemplate(Number(req.params.id), req.family.id, userId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  app.get('/api/leave-time/family', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const allSettings = await storage.getLeaveTimeSettingsForFamily(req.family.id);
      const visible = allSettings.filter((s: any) => s.visibility === "family");
      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const dayKey = dayNames[new Date().getDay()];
      const today = new Date().toISOString().split('T')[0];

      const result = await Promise.all(visible.map(async (s: any) => {
        const override = await storage.getLeaveTimeOverride(s.id, today);
        if (override?.isSkipped) return null;
        const leaveTime = override?.leaveTime || (s.schedule as any)?.[dayKey] || null;
        if (!leaveTime) return null;
        return { userId: s.userId, leaveTime };
      }));

      res.json(result.filter(Boolean));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch family leave times" });
    }
  });

  // ============ FAMILY INVITES ============

  app.post('/api/family-invites', isAuthenticated, requireFamily, requireOwner, async (req: any, res) => {
    try {
      const { role, displayName, expiresInDays } = req.body;
      const token = crypto.randomBytes(24).toString('hex');
      const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null;
      const invite = await storage.createFamilyInvite({
        familyId: req.family.id,
        invitedBy: req.user.claims.sub,
        token,
        role: role || "Adult",
        displayName: displayName || null,
        expiresAt,
      });
      res.status(201).json(invite);
    } catch (err) {
      res.status(500).json({ message: "Failed to create invite" });
    }
  });

  app.get('/api/family-invites', isAuthenticated, requireFamily, requireOwner, async (req: any, res) => {
    try {
      const invites = await storage.getFamilyInvites(req.family.id);
      res.json(invites);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch invites" });
    }
  });

  app.delete('/api/family-invites/:id', isAuthenticated, requireFamily, requireOwner, async (req: any, res) => {
    try {
      await storage.revokeFamilyInvite(Number(req.params.id), req.family.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to revoke invite" });
    }
  });

  app.get('/api/invite/:token', async (req: any, res) => {
    try {
      const invite = await storage.getFamilyInviteByToken(req.params.token);
      if (!invite) return res.status(404).json({ message: "Invite not found" });
      if (invite.status !== "pending") return res.status(410).json({ message: "Invite is no longer valid" });
      if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return res.status(410).json({ message: "Invite has expired" });
      const family = await storage.getFamilyForUser(invite.invitedBy);
      res.json({
        familyName: family?.name || "a family",
        role: invite.role,
        displayName: invite.displayName,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch invite" });
    }
  });

  app.post('/api/invite/:token/accept', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invite = await storage.getFamilyInviteByToken(req.params.token);
      if (!invite) return res.status(404).json({ message: "Invite not found" });
      if (invite.status !== "pending") return res.status(410).json({ message: "Invite is no longer valid" });
      if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return res.status(410).json({ message: "Invite has expired" });

      const existing = await storage.getFamilyForUser(userId);
      if (existing) return res.status(400).json({ message: "You are already part of a family" });

      const { FAMILY_TIERS, ROLE_AGE_RULES, families: familiesTable } = await import("@shared/schema");
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const [family] = await db.select().from(familiesTable).where(eq(familiesTable.id, invite.familyId));
      const members = await storage.getFamilyMembers(invite.familyId);
      const tier = (family as any)?.tier || "core";
      const tierConfig = FAMILY_TIERS[tier as keyof typeof FAMILY_TIERS] || FAMILY_TIERS.core;
      if (members.length >= tierConfig.maxMembers) {
        return res.status(400).json({ message: `This family has reached its ${tierConfig.label} member limit (${tierConfig.maxMembers}). The family owner needs to upgrade their plan or remove a member.` });
      }

      const { displayName, dateOfBirth } = req.body;

      if (invite.role in ROLE_AGE_RULES && !dateOfBirth) {
        return res.status(400).json({ message: "Date of birth is required to join this family." });
      }

      const dob = dateOfBirth ? new Date(dateOfBirth) : undefined;

      if (dob && invite.role in ROLE_AGE_RULES) {
        const ageRules = ROLE_AGE_RULES[invite.role as keyof typeof ROLE_AGE_RULES];
        const now = new Date();
        let age = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
        if (age < ageRules.minAge || age > ageRules.maxAge) {
          return res.status(400).json({ message: `Age doesn't match the ${ageRules.label} role. Your age (${age}) should be between ${ageRules.minAge} and ${ageRules.maxAge === 999 ? '18+' : ageRules.maxAge}.` });
        }
      }

      await storage.addFamilyMember(invite.familyId, userId, invite.role, displayName || invite.displayName, dob);
      await storage.useFamilyInvite(invite.token, userId);

      res.json({ success: true, familyId: invite.familyId });
    } catch (err) {
      res.status(500).json({ message: "Failed to accept invite" });
    }
  });

  // ============ CAREGIVER ROUTES ============

  app.get('/api/caregivers', isAuthenticated, requireFamily, requireOwner, async (req: any, res) => {
    try {
      const list = await storage.getCaregivers(req.family.id);
      res.json(list);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch caregivers" });
    }
  });

  app.post('/api/caregivers', isAuthenticated, requireFamily, requireOwner, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { caregiverUserId, displayName, accessType, expiresAt, assignedChildIds, permissions } = req.body;
      if (!caregiverUserId) return res.status(400).json({ message: "Caregiver user ID is required" });

      const { FAMILY_TIERS } = await import("@shared/schema");
      const tier = ((req.family as any).tier || "core") as keyof typeof FAMILY_TIERS;
      const tierConfig = FAMILY_TIERS[tier] || FAMILY_TIERS.core;
      const existingCaregivers = await storage.getCaregivers(req.family.id);
      const activeCGs = existingCaregivers.filter((c: any) => c.status !== "revoked").length;
      if (activeCGs >= tierConfig.maxCaregivers) {
        return res.status(400).json({ message: `Your ${tierConfig.label} plan allows ${tierConfig.maxCaregivers} caregiver(s). Upgrade your plan or revoke an existing caregiver.` });
      }

      const existing = await storage.getCaregiverByUserId(req.family.id, caregiverUserId);
      if (existing) return res.status(400).json({ message: "This user is already a caregiver for your family" });

      const existingUser = await authStorage.getUser(caregiverUserId);
      if (!existingUser) {
        await authStorage.upsertUser({
          id: caregiverUserId,
          email: `${caregiverUserId}@caregiver.pending`,
          firstName: displayName || "Caregiver",
          lastName: "",
          profileImageUrl: null,
        });
      }

      const cg = await storage.addCaregiver({
        familyId: req.family.id,
        userId: caregiverUserId,
        invitedBy: userId,
        status: "active",
        accessType: accessType || "ongoing",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        assignedChildIds: assignedChildIds || [],
        permissions: permissions || { scheduleAccess: "assigned_only", chatEnabled: true, careNotesEnabled: true, mediaUpload: false },
        displayName: displayName || null,
      });
      res.json(cg);
    } catch (err: any) {
      console.error("Failed to add caregiver:", err.message);
      res.status(500).json({ message: "Failed to add caregiver" });
    }
  });

  app.patch('/api/caregivers/:id', isAuthenticated, requireFamily, requireOwner, async (req: any, res) => {
    try {
      const { assignedChildIds, permissions, accessType, expiresAt, displayName } = req.body;
      const updateData: any = {};
      if (assignedChildIds !== undefined) updateData.assignedChildIds = assignedChildIds;
      if (permissions !== undefined) updateData.permissions = permissions;
      if (accessType !== undefined) updateData.accessType = accessType;
      if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
      if (displayName !== undefined) updateData.displayName = displayName;

      const cg = await storage.updateCaregiver(Number(req.params.id), req.family.id, updateData);
      res.json(cg);
    } catch (err) {
      res.status(500).json({ message: "Failed to update caregiver" });
    }
  });

  app.delete('/api/caregivers/:id', isAuthenticated, requireFamily, requireOwner, async (req: any, res) => {
    try {
      await storage.revokeCaregiver(Number(req.params.id), req.family.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to revoke caregiver" });
    }
  });

  app.get('/api/caregiver/status', isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!req.isCaregiver) return res.json({ isCaregiver: false });
      const cg = await storage.getCaregiverByUserId(req.family.id, userId);
      if (!cg) return res.json({ isCaregiver: false });
      const members = await storage.getFamilyMembers(req.family.id);
      const assignedChildren = members.filter((m: any) => ((cg.assignedChildIds as number[]) || []).includes(m.id));
      res.json({ isCaregiver: true, caregiver: cg, assignedChildren, familyName: req.family.name });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch caregiver status" });
    }
  });

  app.get('/api/caregiver/schedule', isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      if (!req.isCaregiver || !req.caregiverRecord) return res.status(403).json({ message: "Not a caregiver" });
      const perms = (req.caregiverRecord.permissions as any) || {};
      const allEvents = await storage.getEvents(req.family.id);

      let filtered = allEvents;
      if (perms.scheduleAccess === "shared_events") {
        filtered = allEvents.filter((e: any) => !e.isPersonal);
      } else if (perms.scheduleAccess === "child_schedule" || perms.scheduleAccess === "assigned_only") {
        filtered = allEvents.filter((e: any) => !e.isPersonal);
      }
      res.json(filtered);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch caregiver schedule" });
    }
  });

  app.get('/api/caregiver/care-notes', isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      if (!req.isCaregiver || !req.caregiverRecord) return res.status(403).json({ message: "Not a caregiver" });
      const notes = await storage.getCareNotesForCaregiver(req.caregiverRecord.id);
      res.json(notes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch care notes" });
    }
  });

  app.post('/api/caregiver/care-notes', isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      if (!req.isCaregiver || !req.caregiverRecord) return res.status(403).json({ message: "Not a caregiver" });
      const perms = (req.caregiverRecord.permissions as any) || {};
      if (!perms.careNotesEnabled) return res.status(403).json({ message: "Care notes not enabled" });

      const userId = req.user.claims.sub;
      const { childId, type, content } = req.body;
      if (!content) return res.status(400).json({ message: "Content is required" });

      if (childId) {
        const assignedIds = (req.caregiverRecord.assignedChildIds as number[]) || [];
        if (assignedIds.length > 0 && !assignedIds.includes(childId)) {
          return res.status(403).json({ message: "Not assigned to this child" });
        }
      }

      const note = await storage.createCareNote({
        familyId: req.family.id,
        caregiverId: req.caregiverRecord.id,
        childId: childId || null,
        type: type || "general",
        content,
        createdBy: userId,
        noteTime: new Date(),
      });
      res.json(note);
    } catch (err) {
      res.status(500).json({ message: "Failed to create care note" });
    }
  });

  app.get('/api/care-notes', isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      if (req.isCaregiver) return res.status(403).json({ message: "Use /api/caregiver/care-notes" });
      const childId = req.query.childId ? Number(req.query.childId) : undefined;
      const notes = await storage.getCareNotes(req.family.id, childId);
      res.json(notes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch care notes" });
    }
  });

  // ============ OUTSIDE FAMILY CONNECTIONS ============

  app.get('/api/family-connections', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const connections = await storage.getFamilyConnections(req.family.id);
      const enriched = await Promise.all(connections.map(async (conn: any) => {
        const otherFamilyId = conn.requestingFamilyId === req.family.id ? conn.targetFamilyId : conn.requestingFamilyId;
        const [otherFamily] = await db.select({ name: families.name, id: families.id }).from(families).where(eq(families.id, otherFamilyId));
        return { ...conn, otherFamily: otherFamily || null, direction: conn.requestingFamilyId === req.family.id ? 'sent' : 'received' };
      }));
      res.json(enriched);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  app.post('/api/family-connections', isAuthenticated, requireFamily, requireOwner, async (req: any, res) => {
    try {
      const { targetFamilyName, permissions } = req.body;
      if (!targetFamilyName) return res.status(400).json({ message: "Family name required" });
      const [targetFamily] = await db.select().from(families).where(eq(families.name, targetFamilyName));
      if (!targetFamily) return res.status(404).json({ message: "Family not found" });
      if (targetFamily.id === req.family.id) return res.status(400).json({ message: "Cannot connect to your own family" });
      const existing = await storage.getFamilyConnectionByFamilies(req.family.id, targetFamily.id);
      if (existing) return res.status(400).json({ message: "Connection already exists" });
      const conn = await storage.createFamilyConnection({
        requestingFamilyId: req.family.id,
        targetFamilyId: targetFamily.id,
        status: 'pending',
        permissions: permissions || { sharedEvents: true, sharedWishlists: false, chat: false, careNotes: false },
      });
      res.json(conn);
    } catch (err) {
      res.status(500).json({ message: "Failed to create connection" });
    }
  });

  app.patch('/api/family-connections/:id', isAuthenticated, requireFamily, requireOwner, async (req: any, res) => {
    try {
      const { status, permissions } = req.body;
      const updateData: any = {};
      if (status) updateData.status = status;
      if (permissions) updateData.permissions = permissions;
      const conn = await storage.updateFamilyConnection(Number(req.params.id), updateData);
      res.json(conn);
    } catch (err) {
      res.status(500).json({ message: "Failed to update connection" });
    }
  });

  app.delete('/api/family-connections/:id', isAuthenticated, requireFamily, requireOwner, async (req: any, res) => {
    try {
      await storage.deleteFamilyConnection(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete connection" });
    }
  });

  // ============ ACADEMIC TRACKING ============

  app.get('/api/academics/classes', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const studentId = req.query.studentId as string || undefined;
      const role = await storage.getMemberRole(req.family.id, userId);
      if (role === 'Child' || role === 'Youth') {
        const classes = await storage.getAcademicClasses(req.family.id, userId);
        res.json(classes);
      } else {
        const classes = await storage.getAcademicClasses(req.family.id, studentId);
        res.json(classes);
      }
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post('/api/academics/classes', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const { name, teacherName, gradingScale, semester, studentId } = req.body;
      if (!name) return res.status(400).json({ message: "Class name required" });
      const userId = req.user.claims.sub;
      const cls = await storage.createAcademicClass({
        familyId: req.family.id,
        studentId: studentId || userId,
        name,
        teacherName: teacherName || null,
        gradingScale: gradingScale || 'percentage',
        semester: semester || null,
      });
      res.json(cls);
    } catch (err) {
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  app.patch('/api/academics/classes/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const cls = await storage.updateAcademicClass(Number(req.params.id), req.body);
      res.json(cls);
    } catch (err) {
      res.status(500).json({ message: "Failed to update class" });
    }
  });

  app.delete('/api/academics/classes/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      await storage.deleteAcademicClass(Number(req.params.id), req.family.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete class" });
    }
  });

  app.get('/api/academics/classes/:classId/entries', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const entries = await storage.getAcademicEntries(Number(req.params.classId));
      res.json(entries);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch entries" });
    }
  });

  app.post('/api/academics/classes/:classId/entries', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const { type, title, score, maxScore, weight, notes } = req.body;
      if (!title) return res.status(400).json({ message: "Title required" });
      const entry = await storage.createAcademicEntry({
        classId: Number(req.params.classId),
        familyId: req.family.id,
        type: type || 'assignment',
        title,
        score: score || null,
        maxScore: maxScore || null,
        weight: weight || null,
        notes: notes || null,
      });
      res.json(entry);
    } catch (err) {
      res.status(500).json({ message: "Failed to create entry" });
    }
  });

  app.patch('/api/academics/entries/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const entry = await storage.updateAcademicEntry(Number(req.params.id), req.body);
      res.json(entry);
    } catch (err) {
      res.status(500).json({ message: "Failed to update entry" });
    }
  });

  app.delete('/api/academics/entries/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      await storage.deleteAcademicEntry(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete entry" });
    }
  });

  // ============ WORKOUT TRACKING ============

  app.get('/api/workouts', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const targetUserId = req.query.userId as string || undefined;
      const role = await storage.getMemberRole(req.family.id, userId);
      if (targetUserId && targetUserId !== userId) {
        if (role === 'Owner' || role === 'Adult') {
          const targetRole = await storage.getMemberRole(req.family.id, targetUserId);
          if (targetRole === 'Adult' || targetRole === 'Owner') {
            const all = await storage.getWorkouts(req.family.id, targetUserId);
            res.json(all.filter((w: any) => !w.isPrivate));
          } else {
            const all = await storage.getWorkouts(req.family.id, targetUserId);
            res.json(all);
          }
        } else {
          const all = await storage.getWorkouts(req.family.id, targetUserId);
          res.json(all.filter((w: any) => !w.isPrivate));
        }
      } else {
        const all = await storage.getWorkouts(req.family.id, userId);
        res.json(all);
      }
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch workouts" });
    }
  });

  app.post('/api/workouts', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, duration, reps, sets, weight, distance, distanceUnit, notes, isPrivate, date } = req.body;
      if (!type) return res.status(400).json({ message: "Workout type required" });
      const workout = await storage.createWorkout({
        familyId: req.family.id,
        userId,
        type,
        duration: duration || null,
        reps: reps || null,
        sets: sets || null,
        weight: weight || null,
        distance: distance || null,
        distanceUnit: distanceUnit || 'miles',
        notes: notes || null,
        isPrivate: isPrivate !== undefined ? isPrivate : true,
        date: date ? new Date(date) : new Date(),
      });
      res.json(workout);
    } catch (err) {
      res.status(500).json({ message: "Failed to create workout" });
    }
  });

  app.patch('/api/workouts/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const workout = await storage.updateWorkout(Number(req.params.id), req.body);
      res.json(workout);
    } catch (err) {
      res.status(500).json({ message: "Failed to update workout" });
    }
  });

  app.delete('/api/workouts/:id', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      await storage.deleteWorkout(Number(req.params.id), req.family.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete workout" });
    }
  });

  // ============ CHAT ENHANCEMENTS ============

  app.post('/api/conversations/:id/mute', isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { duration } = req.body;
      let until: Date | null = null;
      if (duration === '1h') until = new Date(Date.now() + 60 * 60 * 1000);
      else if (duration === '8h') until = new Date(Date.now() + 8 * 60 * 60 * 1000);
      else if (duration === '24h') until = new Date(Date.now() + 24 * 60 * 60 * 1000);
      else if (duration === '7d') until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      else if (duration === 'indefinite') until = new Date('2099-12-31');
      await storage.muteConversation(Number(req.params.id), userId, until);
      res.json({ success: true, mutedUntil: until });
    } catch (err) {
      res.status(500).json({ message: "Failed to mute conversation" });
    }
  });

  app.post('/api/conversations/:id/unmute', isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.muteConversation(Number(req.params.id), userId, null);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to unmute conversation" });
    }
  });

  app.post('/api/conversations', isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, participantIds, type } = req.body;
      if (type === 'group') {
        if (!name || !participantIds || participantIds.length < 2) {
          return res.status(400).json({ message: "Group chats need a name and at least 2 participants" });
        }
        const allParticipants = [...new Set([userId, ...participantIds])];
        const [conv] = await db.insert(conversations).values({
          familyId: req.family.id,
          type: 'group',
          name,
          status: 'active',
          createdBy: userId,
        }).returning();
        for (const pid of allParticipants) {
          await db.insert(conversationParticipants).values({
            conversationId: conv.id,
            userId: pid,
          });
        }
        res.json(conv);
      } else {
        return res.status(400).json({ message: "Use the DM endpoint for direct messages" });
      }
    } catch (err) {
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // ============ TEMPORARY ADMIN ============

  app.patch('/api/family/members/:id/admin', isAuthenticated, requireFamily, requireOwner, async (req: any, res) => {
    try {
      const { isTemporaryAdmin } = req.body;
      const member = await storage.updateFamilyMember(Number(req.params.id), req.family.id, {
        isTemporaryAdmin: !!isTemporaryAdmin,
      });
      res.json(member);
    } catch (err) {
      res.status(500).json({ message: "Failed to update admin status" });
    }
  });

  // ============ ANNUAL SNAPSHOTS ============

  app.get('/api/snapshots', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const type = req.query.type as string || undefined;
      const snaps = await storage.getSnapshots(req.family.id, type);
      res.json(snaps);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch snapshots" });
    }
  });

  app.post('/api/snapshots/generate', isAuthenticated, requireFamily, blockCaregivers, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, period } = req.body;
      if (!type || !period) return res.status(400).json({ message: "Type and period required" });

      const now = new Date();
      let startDate: Date;
      if (type === 'weekly') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (type === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      } else {
        startDate = new Date(now.getFullYear() - 1, 0, 1);
      }

      const [allExpenses, allGoals, allWorkoutsData, allSavings] = await Promise.all([
        storage.getExpenses(req.family.id),
        storage.getGoals(req.family.id),
        storage.getWorkouts(req.family.id),
        storage.getSavingsGoals(req.family.id),
      ]);

      const periodExpenses = allExpenses.filter((e: any) => new Date(e.date) >= startDate);
      const totalSpent = periodExpenses.reduce((sum: number, e: any) => sum + parseFloat(e.amount || '0'), 0);
      const categoryBreakdown: Record<string, number> = {};
      periodExpenses.forEach((e: any) => {
        const cat = e.category || 'Other';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + parseFloat(e.amount || '0');
      });

      const completedGoals = allGoals.filter((g: any) => g.status === 'completed').length;
      const activeGoals = allGoals.filter((g: any) => g.status === 'active').length;

      const periodWorkouts = allWorkoutsData.filter((w: any) => new Date(w.date) >= startDate);
      const workoutTypes: Record<string, number> = {};
      periodWorkouts.forEach((w: any) => {
        workoutTypes[w.type] = (workoutTypes[w.type] || 0) + 1;
      });

      const totalSaved = allSavings.reduce((sum: number, s: any) => sum + parseFloat(s.currentAmount || '0'), 0);
      const totalTarget = allSavings.reduce((sum: number, s: any) => sum + parseFloat(s.targetAmount || '0'), 0);

      const snapshotData = {
        spending: { total: totalSpent, categoryBreakdown, transactionCount: periodExpenses.length },
        goals: { completed: completedGoals, active: activeGoals, total: allGoals.length },
        workouts: { total: periodWorkouts.length, types: workoutTypes },
        savings: { current: totalSaved, target: totalTarget, progress: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0 },
        generatedAt: now.toISOString(),
      };

      const snapshot = await storage.createSnapshot({
        familyId: req.family.id,
        userId,
        type,
        period,
        data: snapshotData,
      });
      res.json(snapshot);
    } catch (err) {
      res.status(500).json({ message: "Failed to generate snapshot" });
    }
  });

  return httpServer;
}
