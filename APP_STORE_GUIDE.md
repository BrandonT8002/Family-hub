# Family Hub — Deployment & App Store Guide

## Part 1: Deploy Your Backend

The iOS app needs a live backend server. Here are affordable hosting options.

### Option A: Railway (Easiest — ~$5/month)

1. Sign up at [railway.app](https://railway.app)
2. Click **New Project** → **Deploy from GitHub repo** (push your code to GitHub first)
3. Add a **PostgreSQL** database service
4. Set these environment variables in Railway:
   - `DATABASE_URL` — Railway auto-fills this from the PostgreSQL service
   - `SESSION_SECRET` — Any long random string (e.g., `openssl rand -hex 32`)
   - `NODE_ENV` — `production`
5. Railway will auto-detect the Dockerfile and deploy
6. Note your app's URL (e.g., `https://familyhub-production.up.railway.app`)

### Option B: Fly.io (~$5-10/month)

1. Install the Fly CLI: `brew install flyctl`
2. Run `fly launch` in the project directory
3. Create a PostgreSQL database: `fly postgres create`
4. Set secrets:
   ```bash
   fly secrets set SESSION_SECRET=$(openssl rand -hex 32)
   ```
5. Deploy: `fly deploy`
6. Note your app's URL (e.g., `https://familyhub.fly.dev`)

### Option C: Any VPS with Docker (~$4-6/month)

Works with DigitalOcean, Hetzner, Linode, etc.

1. SSH into your server
2. Install Docker and Docker Compose
3. Clone/upload your project
4. Edit `docker-compose.yml`:
   - Change `SESSION_SECRET` to a real random string
   - Optionally change database credentials
5. Run:
   ```bash
   docker compose up -d
   ```
6. Set up a reverse proxy (nginx/Caddy) with SSL for your domain
7. Your app runs on port 5000

### After Deploying: Set Up the Database

Once your server is running, initialize the database tables:

```bash
npx drizzle-kit push
```

Or if using Docker, run it inside the container:
```bash
docker compose exec app npx drizzle-kit push
```

---

## Part 2: iOS App Store Submission

### Prerequisites

1. **Apple Developer Account** — Sign up at [developer.apple.com](https://developer.apple.com) ($99/year)
2. **Mac with Xcode** — Download Xcode from the Mac App Store (free)
3. **CocoaPods** — Install by running: `sudo gem install cocoapods`
4. **Your backend deployed** (from Part 1) with a URL

### Step 1: Get the Project

Clone the project from your GitHub repository to your Mac, or download it as a ZIP.

### Step 2: Install Dependencies

Open Terminal, navigate to the project folder, and run:

```bash
npm install
npm run build
npx cap sync ios
```

### Step 3: Install iOS Dependencies

```bash
cd ios/App
pod install
cd ../..
```

### Step 4: Open in Xcode

```bash
npx cap open ios
```

This opens the Xcode project. You can also manually open `ios/App/App.xcworkspace` in Xcode.

### Step 5: Configure Signing

1. In Xcode, select the **App** project in the left sidebar
2. Select the **App** target
3. Go to the **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Select your **Team** (your Apple Developer account)
6. The Bundle Identifier should be `com.familyhub.app`

### Step 6: Set the Server URL

Point the iOS app to your deployed backend:

1. Open `capacitor.config.ts` in the project root
2. Add your production server URL to the `server` section:

```typescript
server: {
  url: 'https://your-deployed-url.com',
  cleartext: false,
},
```

3. Rebuild and sync:
```bash
npm run build
npx cap sync ios
```

### Step 7: Test on Simulator

1. In Xcode, select an iPhone simulator from the device dropdown (e.g., "iPhone 16 Pro")
2. Press **Cmd + R** or click the Play button to build and run
3. Verify the app works correctly — try registering, logging in, and navigating through all screens

### Step 8: Test on a Real Device (Recommended)

1. Connect your iPhone via USB
2. Select your device in the Xcode device dropdown
3. You may need to trust the developer certificate on your iPhone:
   - Go to **Settings > General > VPN & Device Management** and trust your developer certificate
4. Press **Cmd + R** to build and run on your device

### Step 9: Create an App Store Connect Listing

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in the details:
   - **Platform:** iOS
   - **Name:** Family Hub
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** com.familyhub.app
   - **SKU:** familyhub-app (or any unique string)
4. Click **Create**

### Step 10: Prepare App Store Assets

You'll need these for the listing:

#### Screenshots (Required)
Take screenshots on these simulator sizes:
- **6.7" Display** (iPhone 16 Pro Max) — at least 3 screenshots
- **6.1" Display** (iPhone 16 Pro) — at least 3 screenshots

**Tip:** In Xcode Simulator, use **Cmd + S** to save a screenshot.

Good screenshots to take:
1. Login/Welcome screen
2. Dashboard/Home screen
3. Schedule view
4. Chat screen
5. Goals or Shopping list

#### App Information
- **Category:** Productivity (Primary), Lifestyle (Secondary)
- **Age Rating:** 4+ (no objectionable content)
- **Price:** Free (or set your pricing)

#### Description (Suggested)
```
Family Hub — Your family's productivity command center.

Organize your family life in one beautiful app:

• Smart Dashboard — See your day at a glance with customizable widgets
• Family Schedule — Shared calendar with recurring events
• Shopping Lists — Collaborative grocery and shopping lists
• Money Management — Track bills, expenses, and savings goals
• Family Chat — Private messaging with media sharing
• Goal Tracking — Set and achieve goals together
• Wishlists — Share what you'd love for birthdays and holidays
• Diary — Private, PIN-protected personal journal
• Caregiver Mode — Safe, limited access for babysitters and nannies

Personalize your experience with custom themes, fonts, and dashboard layouts. Everything syncs in real-time across all family members.
```

#### Keywords (Suggested)
```
family,planner,organizer,schedule,budget,shopping,list,goals,chat,productivity
```

#### App Privacy (Required)
Apple requires a privacy questionnaire. For Family Hub:
- **Data Collected:** Name, email address
- **Data Use:** App Functionality
- **Data Linked to User:** Yes (profile info)
- **Tracking:** No

#### Review Notes
When submitting, add review notes for Apple's reviewers:
```
This app uses email/password authentication.
To test: Create a new account with any email and password on the login screen.
After creating an account, you can create a family or join with an invite code.
```

### Step 11: Archive and Upload

1. In Xcode, select **Any iOS Device** as the build target (not a simulator)
2. Go to **Product > Archive**
3. Wait for the archive to complete
4. In the Organizer window that opens, click **Distribute App**
5. Select **App Store Connect** → **Upload**
6. Follow the prompts to upload

### Step 12: Submit for Review

1. Go back to App Store Connect
2. Select your app
3. Under the new version, select the build you uploaded
4. Fill in any remaining required fields
5. Click **Submit for Review**

Apple typically reviews apps within 24-48 hours. You'll receive an email when it's approved (or if changes are needed).

---

## Updating the App

**Web-only changes** (UI, features, bug fixes): Since the iOS app loads from your server, changes are live instantly after deploying to your backend. No App Store update needed.

**Native changes** (Capacitor config, native plugins):
```bash
npm run build
npx cap sync ios
```
Then archive and upload a new version in Xcode.

## Troubleshooting

### "No signing certificate" error
- Make sure you're signed in to Xcode with your Apple Developer account
- Go to **Xcode > Settings > Accounts** and add your Apple ID

### App crashes on launch
- Check the Xcode console for error messages
- Make sure the server URL in `capacitor.config.ts` is correct and the server is running

### White screen on load
- The app needs an internet connection to load from the server
- Verify your deployed server is accessible

### CocoaPods errors
- Run `pod repo update` then `pod install` again
- If that fails, delete `ios/App/Pods` and `ios/App/Podfile.lock`, then run `pod install`
