# FamilyHub

A premium family productivity "operating system" web app.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter (routing), TanStack Query
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Replit Auth (OIDC)

## Project Structure
```
client/src/
  pages/        - Dashboard, Schedule, Money, Groceries, GroceryListDetail, Chat, Settings
  components/   - Layout, AppSidebar, UI components (shadcn)
  hooks/        - use-auth, use-family, use-chat
  lib/          - queryClient
shared/
  schema.ts     - Drizzle schema (all tables)
  routes.ts     - API route definitions with Zod validation
  models/auth.ts - User/session models
server/
  routes.ts     - Express route handlers
  storage.ts    - DatabaseStorage class (all CRUD)
  db.ts         - Database connection
  vite.ts       - Vite dev server setup (DO NOT MODIFY)
```

## Database Tables
- **users** - Replit Auth users
- **families** - Family groups with theme/font config
- **family_members** - Join table (userId, familyId, role, displayName, dateOfBirth)
- **events** - Calendar events (personal/shared, recurring)
- **expenses** - Money tracking
- **financial_schedule** - Bills/paydays
- **savings_goals** - Family savings
- **grocery_lists** - Shopping lists
- **grocery_items** - Items in lists
- **conversations** - Chat conversations (group/dm), with status (active/pending for message requests)
- **conversation_participants** - Users in each conversation
- **chat_messages** - Messages linked to conversations
- **blocks** - User blocking system

## Features
- **Dashboard**: Overview of events, expenses, savings
- **Schedule**: Calendar with recurring events, personal/shared
- **Money**: Expenses, financial schedule, savings goals
- **Groceries**: Shopping lists with Wants/Needs categorization
- **Chat**: Family group chat + private DMs with message request system, blocking, message deletion
- **Settings**: Theme presets (Pastel, Colorful, Basic, Monochrome, Deep Night), font selection, per-module color customization

## Privacy Architecture
- Role-based: Owner, Adult, Teen, Youth, Child, Caregiver
- Owner manages structure, not content
- DMs are private (owner cannot read)
- Message request system for new DMs
- Blocking with confirmation
- Message deletion (soft delete)

## Design Notes
- Font: Configurable (default Bricolage Grotesque), stored in families.fontFamily
- Theme colors: Applied via inline styles (not Tailwind classes) from families.themeConfig
- Cards: rounded-[2rem], bg-white/90, backdrop-blur-xl, shadow-sm
- No hover:bg-* on buttons
- `data-testid` attributes on interactive elements
