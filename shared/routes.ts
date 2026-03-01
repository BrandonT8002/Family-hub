import { z } from 'zod';
import { 
  families,
  events,
  expenses,
  groceryLists,
  groceryItems,
  chatMessages
} from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  family: {
    get: {
      method: 'GET' as const,
      path: '/api/family' as const,
      responses: {
        200: z.custom<typeof families.$inferSelect>().nullable(),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/family' as const,
      input: z.object({ name: z.string(), themeConfig: z.any().optional() }),
      responses: {
        201: z.custom<typeof families.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    }
  },
  events: {
    list: {
      method: 'GET' as const,
      path: '/api/events' as const,
      responses: {
        200: z.array(z.custom<typeof events.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events' as const,
      input: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.string(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        recurrence: z.string().optional(),
        isPersonal: z.boolean().optional(),
        notes: z.string().optional(),
        location: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof events.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  expenses: {
    list: {
      method: 'GET' as const,
      path: '/api/expenses' as const,
      responses: {
        200: z.array(z.custom<typeof expenses.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/expenses' as const,
      input: z.object({
        amount: z.number().or(z.string()),
        category: z.string(),
        vendor: z.string().optional(),
        description: z.string(),
        date: z.string().optional(),
        notes: z.string().optional(),
        tag: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof expenses.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    }
  },
  financialSchedule: {
    list: {
      method: 'GET' as const,
      path: '/api/financial-schedule' as const,
      responses: {
        200: z.array(z.custom<typeof financialSchedule.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/financial-schedule' as const,
      input: z.object({
        title: z.string(),
        amount: z.number().or(z.string()),
        type: z.string(),
        frequency: z.string().optional(),
        dueDate: z.string(),
        isPayday: z.boolean().optional(),
      }),
      responses: {
        201: z.custom<typeof financialSchedule.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    }
  },
  savingsGoals: {
    list: {
      method: 'GET' as const,
      path: '/api/savings-goals' as const,
      responses: {
        200: z.array(z.custom<typeof savingsGoals.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/savings-goals' as const,
      input: z.object({
        name: z.string(),
        targetAmount: z.number().or(z.string()),
        currentAmount: z.number().or(z.string()).optional(),
      }),
      responses: {
        201: z.custom<typeof savingsGoals.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/savings-goals/:id' as const,
      input: z.object({
        currentAmount: z.number().or(z.string()),
      }),
      responses: {
        200: z.custom<typeof savingsGoals.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    }
  },
  groceryLists: {
    list: {
      method: 'GET' as const,
      path: '/api/grocery-lists' as const,
      responses: {
        200: z.array(z.custom<typeof groceryLists.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/grocery-lists' as const,
      input: z.object({ name: z.string(), type: z.string().optional().default("Needs") }),
      responses: {
        201: z.custom<typeof groceryLists.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    }
  },
  groceryItems: {
    list: {
      method: 'GET' as const,
      path: '/api/grocery-lists/:listId/items' as const,
      responses: {
        200: z.array(z.custom<typeof groceryItems.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/grocery-lists/:listId/items' as const,
      input: z.object({ name: z.string(), category: z.string(), price: z.number().or(z.string()).optional() }),
      responses: {
        201: z.custom<typeof groceryItems.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    toggle: {
      method: 'PATCH' as const,
      path: '/api/grocery-items/:id/toggle' as const,
      input: z.object({ isChecked: z.boolean() }),
      responses: {
        200: z.custom<typeof groceryItems.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    }
  },
  chat: {
    list: {
      method: 'GET' as const,
      path: '/api/chat' as const,
      responses: {
        200: z.array(z.custom<typeof chatMessages.$inferSelect & { user: { firstName: string | null, lastName: string | null, profileImageUrl: string | null } }>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/chat' as const,
      input: z.object({ content: z.string() }),
      responses: {
        201: z.custom<typeof chatMessages.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
