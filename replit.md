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
  pages/        - Dashboard, Schedule, Money, Groceries, GroceryListDetail, Chat, Diary, Goals, Wishlists, LeaveTime, Settings
  components/   - Layout, BottomNav, UI components (shadcn)
  hooks/        - use-auth, use-family, use-chat, use-expenses, use-diary, use-goals, use-wishlists, use-leave-time
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

## Navigation
- **Bottom Nav Bar** (replaced sidebar): Floating pill at screen bottom, frosted glass, auto-hides on scroll down, reappears on scroll up
  - Primary tabs (always visible): Home, Schedule, Chat, Shopping
  - "More" button opens slide-up panel with: Money, Diary, Goals, Wishlists, Leave Time, Settings, Profile/Logout
  - Active indicator: animated pill with layoutId transition
  - All screens use bottom padding (pb-24) to account for nav height

## Database Tables
- **users** - Replit Auth users
- **families** - Family groups with theme/font config
- **family_members** - Join table (userId, familyId, role, displayName, dateOfBirth)
- **events** - Calendar events (personal/shared, recurring)
- **expenses** - Money tracking
- **financial_schedule** - Bills/paydays (creatorId, billType, category, notes, isPaid, autoPay, reminderDays)
- **savings_goals** - Family savings
- **goal_categories** - User-created goal categories (name, icon, color)
- **goals** - Goal tracking (title, description, categoryId, type [short/long-term], progressType [checklist/numeric/streak/milestone], visibility [personal/family], status [active/completed/archived], targetValue, currentValue, unit, dueDate, streak, bestStreak, lastStreakDate, linkedSavingsGoalId)
- **goal_items** - Checklist/milestone items for goals (title, isCompleted, sortOrder)
- **wishlists** - Wishlist lists (name, description, visibility [family/private], hideClaimedBy for gift surprises, creatorId)
- **wishlist_items** - Wishlist items (name, category, estimatedPrice, storeName, storeLink, notes, priority, wantOrNeed, status [unclaimed/claimed/purchased], claimedBy)
- **grocery_lists** - Shopping lists (with creatorId, isPrivate, listCategory for categorization)
- **grocery_items** - Items in lists
- **leave_time_settings** - Per-user leave time config (schedule as JSONB {mon:"07:45",...}, reminderMinutes, visibility, showOnDashboard, checklistEnabled, defaultChecklist)
- **leave_time_overrides** - Date-specific overrides (leaveTime, isSkipped, customChecklist)
- **leave_time_templates** - Reusable checklist templates (name, items[])
- **conversations** - Chat conversations (group/dm), with status (active/pending for message requests)
- **conversation_participants** - Users in each conversation
- **chat_messages** - Messages linked to conversations (messageType: text/image/video/voice, mediaUrl, mediaDuration)
- **blocks** - User blocking system
- **diary_entries** - Private diary entries (title, body, mood, tags, photoUrls, isPrivate, sharedWith, soft-delete)
- **diary_settings** - Per-user diary settings (PIN lock, weekly reflection prompt)

## Features
- **Dashboard**: Overview of events, expenses, savings, Leave Time widget (countdown + interactive checklist)
- **Schedule**: Calendar with recurring events, personal/shared
- **Money**: Bill-centric management with bill types (housing, utility, subscription, insurance, transportation, education, internet, shopping), recurring/one-time tracking, due date mapping with overdue/due-soon alerts, annual cost projections per bill and by type, paid/unpaid toggle, auto-pay flag, edit/delete bills, expense logging, savings goals; bills appear on Schedule calendar
- **Groceries/Shopping**: Shopping lists with Wants/Needs categorization, private/shared toggle per list, list categories (Groceries, Household, School Supplies, Home Improvement, Baby & Kids, Pet Supplies, Health & Pharmacy, Electronics, General, Other), category filtering
- **Wishlists**: Personal and family wishlists with gift surprise support (hideClaimedBy), item claiming by family members, purchased tracking, item categories, estimated prices, store links, priority levels, want/need classification, visibility (family/private), creator-only item management
- **Chat**: Family group chat + private DMs with message request system, blocking, message deletion, media messages (photos, videos, voice notes via file upload + MediaRecorder API)
- **Diary**: Protected private reflection space — PIN lock, mood tracking (10 moods), tags, photo attachments, privacy per entry, search/filter, mood insights with distribution charts, soft-delete with 30-day trash, diary settings (PIN, weekly reflection prompt)
- **Goals**: Comprehensive goal tracking with user-created categories (starter pack available), short-term and long-term goals, 4 progress types (checklist, numeric, streak/consistency, milestones), personal/family visibility, active/completed/archived status, due date tracking with overdue alerts, filtering by type/category, sorting by due date/recently updated, streak tracking with daily check-in and best streak counter
- **Leave Time**: Intention-setting walk-out time system — recurring weekly schedule (per-day times), same-weekday/everyday quick-set, daily overrides, skip today, pre-departure checklist with quick-add suggestions and reusable templates, reminder timing (5-30 min), private/family visibility, dashboard integration with countdown and interactive checklist, kind non-judgmental tone
- **Settings**: Theme presets (Pastel, Colorful, Basic, Monochrome, Deep Night), font selection, per-module color customization (includes diary, goals, wishlists, leave time)

## Privacy Architecture
- Role-based: Owner, Adult, Teen, Youth, Child, Caregiver
- Owner manages structure, not content
- DMs are private (owner cannot read)
- Message request system for new DMs
- Blocking with confirmation
- Message deletion (soft delete)
- Leave Time is private by default, optionally shared with family

## Design Notes
- Font: Configurable (default Bricolage Grotesque), stored in families.fontFamily
- Theme colors: Applied via inline styles (not Tailwind classes) from families.themeConfig
- Cards: rounded-[2rem], bg-white/90, backdrop-blur-xl, shadow-sm
- Bottom nav: Frosted glass (bg-white/80 backdrop-blur-2xl), floating pill, rounded-[1.75rem], shadow-[0_8px_32px], auto-hide on scroll
- `data-testid` attributes on interactive elements
