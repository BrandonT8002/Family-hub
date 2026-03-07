# Family Hub — App Store Submission Guide

## Prerequisites

1. **Apple Developer Account** — Sign up at [developer.apple.com](https://developer.apple.com) ($99/year)
2. **Mac with Xcode** — Download Xcode from the Mac App Store (free)
3. **CocoaPods** — Install by running: `sudo gem install cocoapods`

## Step 1: Download the Project

Download the entire project folder from Replit to your Mac. You can use the "Download as ZIP" option from the three-dot menu in the Files panel.

## Step 2: Install Dependencies

Open Terminal, navigate to the project folder, and run:

```bash
npm install
npm run build
npx cap sync ios
```

## Step 3: Install iOS Dependencies

```bash
cd ios/App
pod install
cd ../..
```

## Step 4: Open in Xcode

```bash
npx cap open ios
```

This opens the Xcode project. You can also manually open `ios/App/App.xcworkspace` in Xcode.

## Step 5: Configure Signing

1. In Xcode, select the **App** project in the left sidebar
2. Select the **App** target
3. Go to the **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Select your **Team** (your Apple Developer account)
6. The Bundle Identifier should be `com.familyhub.app`

## Step 6: Set the Server URL

Before building for the App Store, you need to point the app to your deployed web server.

1. Open `capacitor.config.ts` in the project root
2. Add your production server URL:

```typescript
server: {
  url: 'https://your-app.replit.app',
  cleartext: false,
},
```

3. Run `npx cap sync ios` again after changing this

**Important:** The app needs a live, deployed backend to work. Make sure your Replit app is published/deployed first.

## Step 7: Test on Simulator

1. In Xcode, select an iPhone simulator from the device dropdown (e.g., "iPhone 16 Pro")
2. Press **Cmd + R** or click the Play button to build and run
3. Verify the app works correctly — check all screens, navigation, and functionality

## Step 8: Test on a Real Device (Recommended)

1. Connect your iPhone via USB
2. Select your device in the Xcode device dropdown
3. You may need to trust the developer certificate on your iPhone:
   - Go to **Settings > General > VPN & Device Management** and trust your developer certificate
4. Press **Cmd + R** to build and run on your device

## Step 9: Create an App Store Connect Listing

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in the details:
   - **Platform:** iOS
   - **Name:** Family Hub
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** com.familyhub.app
   - **SKU:** familyhub-app (or any unique string)
4. Click **Create**

## Step 10: Prepare App Store Assets

You'll need these for the listing:

### Screenshots (Required)
Take screenshots on these simulator sizes:
- **6.7" Display** (iPhone 16 Pro Max) — at least 3 screenshots
- **6.1" Display** (iPhone 16 Pro) — at least 3 screenshots
- **5.5" Display** (iPhone 8 Plus) — optional but recommended

**Tip:** In Xcode Simulator, use **Cmd + S** to save a screenshot.

Good screenshots to take:
1. Dashboard/Home screen
2. Schedule view
3. Chat screen
4. Goals or Shopping list
5. Settings/Personalization

### App Information
- **Category:** Productivity (Primary), Lifestyle (Secondary)
- **Age Rating:** 4+ (no objectionable content)
- **Price:** Free (or set your pricing)

### Description (Suggested)
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

### Keywords (Suggested)
```
family,planner,organizer,schedule,budget,shopping,list,goals,chat,productivity
```

### App Privacy (Required)
Apple requires a privacy questionnaire. For Family Hub, you'll need to declare:
- **Data Collected:** Name, email (from Replit Auth login)
- **Data Use:** App Functionality
- **Data Linked to User:** Yes (profile info)
- **Tracking:** No

### Review Notes
When submitting, add review notes for Apple's reviewers:
```
This app uses Replit OAuth for authentication. To test, you'll need a Replit account.
You can create a free account at https://replit.com/signup.
After logging in, you can create a family or join with an invite code.
```

## Step 11: Archive and Upload

1. In Xcode, select **Any iOS Device** as the build target (not a simulator)
2. Go to **Product > Archive**
3. Wait for the archive to complete
4. In the Organizer window that opens, click **Distribute App**
5. Select **App Store Connect** → **Upload**
6. Follow the prompts to upload

## Step 12: Submit for Review

1. Go back to App Store Connect
2. Select your app
3. Under the new version, select the build you uploaded
4. Fill in any remaining required fields
5. Click **Submit for Review**

Apple typically reviews apps within 24-48 hours. You'll receive an email when it's approved (or if changes are needed).

## Updating the App

When you make changes to the web app:

1. If the app points to your live server URL (Step 6), web changes are live instantly — no App Store update needed
2. If you need to update native behavior or the Capacitor config:
   ```bash
   npm run build
   npx cap sync ios
   ```
   Then archive and upload a new version in Xcode

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
