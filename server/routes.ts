import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth setup MUST be before other routes
  await setupAuth(app);
  registerAuthRoutes(app);

  // Helper to ensure user has a family
  const requireFamily = async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const family = await storage.getFamilyForUser(userId);
    if (!family) return res.status(400).json({ message: "No family found" });
    req.family = family;
    next();
  };

  // Seed data function
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
    const family = await storage.getFamilyForUser(userId);
    if (family) {
      await seedMoneyData(family.id, userId);
    }
    res.json(family);
  });

  app.post(api.family.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.family.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      const family = await storage.createFamily(input.name, userId);
      if (input.themeConfig) {
        await storage.updateFamily(family.id, { themeConfig: input.themeConfig });
      }
      res.status(201).json(family);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

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

  app.get(api.expenses.list.path, isAuthenticated, requireFamily, async (req: any, res) => {
    const expenses = await storage.getExpenses(req.family.id);
    res.json(expenses);
  });

  app.post(api.expenses.create.path, isAuthenticated, requireFamily, async (req: any, res) => {
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

  app.get(api.financialSchedule.list.path, isAuthenticated, requireFamily, async (req: any, res) => {
    const schedule = await storage.getFinancialSchedule(req.family.id);
    res.json(schedule);
  });

  app.post(api.financialSchedule.create.path, isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const input = api.financialSchedule.create.input.parse(req.body);
      const item = await storage.createFinancialSchedule({
        ...input,
        amount: input.amount.toString(),
        dueDate: new Date(input.dueDate),
        familyId: req.family.id,
      });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.savingsGoals.list.path, isAuthenticated, requireFamily, async (req: any, res) => {
    const goals = await storage.getSavingsGoals(req.family.id);
    res.json(goals);
  });

  app.post(api.savingsGoals.create.path, isAuthenticated, requireFamily, async (req: any, res) => {
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

  app.patch(api.savingsGoals.update.path, isAuthenticated, requireFamily, async (req: any, res) => {
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

  app.get(api.groceryLists.list.path, isAuthenticated, requireFamily, async (req: any, res) => {
    const lists = await storage.getGroceryLists(req.family.id);
    res.json(lists);
  });

  app.post(api.groceryLists.create.path, isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const input = api.groceryLists.create.input.parse(req.body);
      const list = await storage.createGroceryList({
        ...input,
        familyId: req.family.id,
        storeName: (req.body as any).storeName || null,
        type: input.type || "Needs",
      });
      res.status(201).json(list);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.groceryItems.list.path, isAuthenticated, requireFamily, async (req: any, res) => {
    const items = await storage.getGroceryItems(Number(req.params.listId));
    res.json(items);
  });

  app.post(api.groceryItems.create.path, isAuthenticated, requireFamily, async (req: any, res) => {
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

  app.patch(api.groceryItems.toggle.path, isAuthenticated, requireFamily, async (req: any, res) => {
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

  app.get(api.chat.list.path, isAuthenticated, requireFamily, async (req: any, res) => {
    const msgs = await storage.getChatMessages(req.family.id);
    res.json(msgs);
  });

  app.post(api.chat.create.path, isAuthenticated, requireFamily, async (req: any, res) => {
    try {
      const input = api.chat.create.input.parse(req.body);
      const msg = await storage.createChatMessage({
        content: input.content,
        familyId: req.family.id,
        senderId: req.user.claims.sub,
      });
      res.status(201).json(msg);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  return httpServer;
}
