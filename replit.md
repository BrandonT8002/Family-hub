# FamilyHub

A premium family productivity "operating system" web app.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter (routing), TanStack Query
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Email/password with bcrypt hashing, express-session (connect-pg-simple)
- **PWA**: manifest.json, service worker (sw.js), app icons for mobile install
- **Deployment**: Dockerfile + docker-compose.yml for portable hosting (Railway, Fly.io, VPS)

## Project Structure
```
client/src/
  pages/        - Dashboard, Schedule, Money, Groceries, GroceryListDetail, Chat, Diary, Goals, Wishlists, LeaveTime, Settings (8-section hub), CaregiverDashboard, CareNotes, Academics, Workouts, Connections, Snapshots, Members
  components/   - Layout, BottomNav, UI components (shadcn)
  hooks/        - use-auth, use-family, use-chat, use-expenses, use-diary, use-goals, use-wishlists, use-leave-time, use-caregivers, use-preferences, use-groceries
  lib/          - queryClient, auth-utils
shared/
  schema.ts     - Drizzle schema (all tables)
  routes.ts     - API route definitions with Zod validation
  models/auth.ts - User/session models (password field for email/password auth)
server/
  auth.ts       - Email/password auth (bcrypt, session-based login/register/logout)
  routes.ts     - Express route handlers
  storage.ts    - DatabaseStorage class (all CRUD)
  db.ts         - Database connection
  vite.ts       - Vite dev server setup (DO NOT MODIFY)
client/public/
  manifest.json - PWA manifest
  sw.js         - Service worker
  icon-192.png  - App icon 192x192
  icon-512.png  - App icon 512x512
ios/              - Capacitor iOS project (open in Xcode)
capacitor.config.ts - Capacitor configuration
APP_STORE_GUIDE.md  - Deployment + App Store submission guide
Dockerfile          - Multi-stage Docker build
docker-compose.yml  - App + PostgreSQL for self-hosting
```

## Auth System
- **Registration**: POST /api/auth/register (email, password, firstName, lastName)
- **Login**: POST /api/auth/login (email, password)
- **Logout**: POST /api/auth/logout
- **Current user**: GET /api/auth/user
- Passwords hashed with bcrypt (12 rounds)
- Sessions stored in PostgreSQL via connect-pg-simple
- `req.session.userId` is the user identifier in all route handlers
- `isAuthenticated` middleware checks for valid session

## Navigation
- **Bottom Nav Bar** (replaced sidebar): Floating pill at screen bottom, frosted glass, auto-hides on scroll down, reappears on scroll up
  - Primary tabs (always visible): Home, Schedule, Chat, Shopping
  - "More" button opens slide-up panel with configurable items: Money, Goals, Wishlists, Academics, Workouts, Snapshots, Diary, Leave Time, Members, Connections, Caregiver, Settings, Profile/Logout
  - More menu respects user preferences (order and visibility from usePreferences hook)
  - Active indicator: animated pill with layoutId transition
  - All screens use bottom padding (pb-32) to account for nav height

## Database Tables
- **users** - Email/password authenticated users (id varchar, email, password hash, firstName, lastName, profileImageUrl)
- **families** - Family groups with tier (core/plus/extended), theme/font config
- **family_members** - Join table (userId, familyId, role, displayName, dateOfBirth)
- **events** - Calendar events (personal/shared, recurring)
- **expenses** - Money tracking
- **financial_schedule** - Bills/paydays (creatorId, billType, category, notes, isPaid, autoPay, reminderDays)
- **savings_goals** - Family savings
- **goal_categories** - User-created goal categories (name, icon, color)
- **goals** - Goal tracking (title, description, categoryId, type, progressType, visibility, status, targetValue, currentValue, unit, dueDate, streak, bestStreak, lastStreakDate, linkedSavingsGoalId, lastUpdatedBy)
- **goal_items** - Checklist/milestone items for goals
- **wishlists** - Wishlist lists
- **wishlist_items** - Wishlist items
- **grocery_lists** - Shopping lists (creatorId, isPrivate, listCategory)
- **grocery_items** - Items in lists (addedBy field for collaboration tracking)
- **leave_time_settings** - Per-user leave time config
- **leave_time_overrides** - Date-specific overrides
- **leave_time_templates** - Reusable checklist templates
- **conversations** - Chat conversations (group/dm)
- **conversation_participants** - Users in each conversation
- **chat_messages** - Messages linked to conversations
- **blocks** - User blocking system
- **diary_entries** - Private diary entries
- **diary_settings** - Per-user diary settings
- **caregivers** - Caregiver access records
- **care_notes** - Caregiver activity logs
- **caregiver_checklists** - Shared checklists between parents and caregivers (familyId, caregiverId, title, items JSONB, createdBy)
- **user_preferences** - Per-user dashboard/nav personalization (userId, familyId, dashboardWidgets JSONB, navOrder JSONB)

## Features
- **Dashboard**: Widget-based with personalization — users can toggle and reorder widgets (leaveTime, schedule, todayEvents, quickActions, upcomingBills, savings, tomorrow) via Settings > Personalize
- **Schedule**: Calendar with recurring events (Daily/Weekly/Monthly/Yearly), creator attribution
- **Money**: Bill management with types, due dates, auto-pay, annual projections, expenses, savings goals
- **Groceries/Shopping**: Shopping lists with collaboration — shows who added each item (addedByName), contributors section, prominent privacy toggle, polling for real-time updates
- **Wishlists**: Personal and family wishlists with gift surprise support
- **Chat**: Family group chat + DMs with message requests, blocking, media messages, mute, unread tracking, sender names displayed
- **Diary**: PIN-locked private reflection with mood tracking, tags, photos
- **Goals**: Goal tracking with +/- progress buttons, categories, 4 progress types, collaboration indicators (creatorDisplayName, lastUpdatedByName), family goals tab, polling
- **Leave Time**: Walk-out time system with checklist, reminders, dashboard integration
- **Caregiver Mode**: Limited-access mode with shared checklists, care notes, restricted navigation
- **Members Hub**: Family member cards with role badges, quick actions (Message, View Schedule)
- **Settings**: 8-section hub (Appearance, Personalize, Family, Permissions, Connections, Chat & Privacy, Caregivers, Account)
  - **Personalize**: Dashboard widget toggles/reorder + navigation menu item toggles/reorder
- **PWA**: Installable on mobile with manifest.json and service worker
- **iOS Native (Capacitor)**: Wrapped for App Store submission with safe areas, haptics, status bar, keyboard handling

## Privacy Architecture
- Role-based: Owner, Adult, Teen, Youth, Child, Caregiver
- Owner manages structure, not content
- DMs are private (owner cannot read)
- Blocking, message requests, soft-delete
- Leave Time private by default

## Design Notes
- Font: Configurable (default Bricolage Grotesque)
- Theme colors: Applied via inline styles from families.themeConfig
- Cards: rounded-[2rem], bg-white/90, backdrop-blur-xl, shadow-sm
- Bottom nav: Frosted glass, floating pill, auto-hide on scroll
- `data-testid` attributes on interactive elements

## Key Patterns
- `requireFamily` middleware sets `req.family`, `req.isCaregiver`, `req.caregiverRecord`
- `blockCaregivers` blocks sensitive routes for caregiver users
- `requireOwner` checks `req.family.ownerId === userId`
- Schema push: `printf "1\n1\n1\n1\n1\n" | npx drizzle-kit push --force`
- Chat unread route (`GET /api/conversations/unread-count`) must be before parameterized routes

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Secret for signing session cookies
- `NODE_ENV` — `development` or `production`
- `PORT` — Server port (default 5000)
