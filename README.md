# Caprianne Trdz - Trading Performance System

## 📋 Project Overview

Caprianne Trdz is a cross-platform trading performance operating system built with React Native, Expo, Tauri, and Firebase. It allows traders to:

- **Track trades** with precision (entry, stop loss, take profit, actual exit, result)
- **Auto-calculate R:R ratios** using SMC price action rules
- **Manage editable SMC checklists** as customizable tables
- **Log psychology & emotions** and correlate with trading results
- **Generate analytics** (win rate, profit factor, performance by pair/session/setup)
- **Follow trading routines** (Pre-Market, Execution, Post-Trade, Weekly Review)

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 19 + React Native 0.81
- Expo (mobile) + React Native Web (web) + Tauri (desktop)
- React Navigation (tab + stack navigation)
- TypeScript for type safety

**Backend:**
- Firebase Authentication (user login)
- Firebase Firestore (trades, checklists, psychology logs)
- Supabase Storage (trade screenshots) - migrated from Firebase Storage

**Utilities:**
- Client-side calculations: R:R, confluence scores, analytics
- No backend computation needed

### Folder Structure

```
src/
├── config/
│   ├── firebase.ts           # Firebase initialization
│   └── supabase.ts           # Supabase initialization
├── types/
│   └── index.ts              # All TypeScript interfaces
├── context/
│   └── AppContext.tsx        # Global state management
├── hooks/
│   └── useAppContext.ts      # Context hook
├── services/
│   ├── firebaseService.ts    # Firebase CRUD operations
│   └── supabaseImageService.ts # Supabase image operations
├── utils/
│   ├── calculations.ts       # R:R, confluence, analytics
│   ├── chartingUtils.ts      # Chart helper functions
│   └── tauriUtils.ts         # Tauri desktop utilities
├── components/
│   ├── EditableChecklistTable.tsx  # Table component for checklist editing
│   ├── ImageUploader.tsx     # Cross-platform image uploader
│   ├── CalendarHeatmap.tsx   # Psychology logging calendar
│   └── ... (various UI components)
├── navigation/
│   └── TabNavigator.tsx      # Bottom tab + stack navigation
└── screens/
    ├── DashboardScreen.tsx
    ├── JournalScreen.tsx
    ├── AnalyticsScreen.tsx
    ├── RoutineScreen.tsx
    ├── SettingsScreen.tsx
    ├── AddTradeScreen.tsx
    └── TradeDetailScreen.tsx
```

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Configure Firebase

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable:
   - Authentication (Email/Password)
   - Firestore Database (in native mode)
   - Storage

3. Create `.env.local` file in the project root (copy from `.env.local` template):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Update the values with your actual Firebase configuration:
   - Navigate to Firebase Console -> Project Settings -> General -> Your apps
   - Copy the config values from the "Firebase SDK snippet" section

### 3. Configure Supabase (for image storage)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings -> API
3. Add to your `.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Note: If you skip these steps, the app will run in offline mode with limited functionality.

### 4. Firestore Collections Schema

Create these collections in Firebase:

**Collection: `trades`**
```
{
  userId: string
  pair: string (e.g., "GBPUSD")
  direction: "Buy" | "Sell"
  session: "London" | "NY" | "Asia"
  entryPrice: number
  stopLoss: number
  takeProfit: number
  actualExit?: number
  result?: "Win" | "Loss" | "Break-even"
  riskToReward: number
  confluenceScore: number
  grade: "A+" | "A" | "B" | "C" | "D"
  setupType: string
  emotionalRating: 1-10
  ruleDeviation: boolean
  screenshots: string[] (Firebase Storage URLs)
  notes: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Collection: `checklist_template`**
```
{
  userId: string
  items: [
    {
      id: string
      label: string
      description: string
      weight: number
      category: "Critical" | "Important" | "Optional"
      createdAt: timestamp
    }
  ]
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Collection: `psychology_logs`**
```
{
  userId: string
  date: timestamp
  emotionalState: 1-10
  notes: string
  deviations: string[]
  confidenceRating: 1-10
  sessionIntentions: string
}
```

### 4. Run the App

**Development (Expo):**
```bash
npm start              # Start Expo server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run on web browser
```

**Desktop (Tauri):**
```bash
npm run tauri dev      # Development mode
npm run tauri build    # Production build
```

## 🎯 Key Features

### 1. Manual Trade Entry

- **Pair Selection**: GBPUSD, EURUSD, USDJPY, etc.
- **Direction**: Buy/Sell
- **Session**: London/NY/Asia
- **Prices**: Entry, Stop Loss, Take Profit, Actual Exit
- **Result**: Win/Loss/Break-even
- **Auto-Calculate**: R:R ratio, Confluence Score, Grade
- **Psychology**: Emotional rating (1-10), rule deviation flag
- **Documentation**: Notes, screenshots

### 2. Editable SMC Checklist Table

The **EditableChecklistTable** component features:

- **Columns**: Item Name | Description | Weight | Category | Actions
- **Categories**: Critical (red) | Important (gold) | Optional (blue)
- **Actions**: Edit (✎) | Delete (🗑) | Add new items
- **Dynamic Scoring**: Confluence score auto-updates based on selected items
- **Inline Editing**: Edit directly in table without modal

### 3. SMC Execution Protocols

The Routine screen organizes checklists by category:

- **Pre-Market**: Directional bias, liquidity marking, emotional readiness
- **Execution**: Bias break?, liquidity sweep?, valid OB?, FVG?, ChoCh confirmation
- **Post-Trade**: Screenshot upload, emotional log, rule deviation, lessons
- **Weekly Review**: Pattern analysis, deviation count, emotional trends, performance

### 4. Analytics Dashboard

Visualizes:

- Win rate (%)
- Average R:R (1:X)
- Profit factor
- Performance by pair
- Performance by session
- Performance by setup type
- Emotional correlation
- Deviation rate (%)

### 5. Psychology System

Daily logging:

- Emotional state (1-10)
- Notes describing mindset
- Deviations logged
- Confidence rating
- Session intentions

The app correlates mood vs:

- Trade results
- R:R quality
- Rule deviations
- Session performance

## 🧮 Calculation Functions

Located in `src/utils/calculations.ts`:

```typescript
calculateRiskToReward(entry, stopLoss, takeProfit, direction);
// Returns: 1:X ratio

calculateConfluenceScore(selectedItemIds, allItemsMap);
// Returns: 0-100 score based on selected checklist items

assignGrade(confluenceScore);
// Returns: "A+" | "A" | "B" | "C" | "D"

calculateWinRate(trades);
// Returns: percentage

calculateAverageRR(trades);
// Returns: average 1:X ratio

calculateProfitFactor(trades);
// Returns: gross profit / gross loss

calculateDeviationRate(trades);
// Returns: percentage of trades with deviations

generateEquityCurve(trades, initialCapital);
// Returns: array of {date, value} for graphing
```

## 🎨 Theme & UI

**Dark Cinematic Aesthetic:**

- Background: `#0d0d0d` (graphite)
- Text: `#f5f5f5` (whitesmoke)
- Accent: `#00d4d4` (cyan/teal glow)
- Win: `#4caf50` (green)
- Loss: `#f44336` (red)

**Navigation:**

- Bottom Tab Navigator (5 tabs)
- Stack navigators per tab for detail screens
- Modal presentations for trade entry

## 🔧 Cross-Platform Compatibility

This application has been enhanced with full cross-platform support:

### Platform Support Matrix

| Feature | Mobile (iOS/Android) | Web | Desktop (Tauri) |
|---------|----------------------|-----|-----------------|
| Trade Tracking | ✅ Full | ✅ Full | ✅ Full |
| Analytics | ✅ Full | ✅ Full | ✅ Full |
| SMC Checklists | ✅ Full | ✅ Full | ✅ Full |
| Image Uploads | ✅ Full | ✅ Full | ✅ Full |
| Psychology Logging | ✅ Full | ✅ Full | ✅ Full |

### Key Cross-Platform Enhancements

1. **Platform-Aware Navigation**
   - Uses `@react-navigation/native-stack` for mobile
   - Switches to `@react-navigation/bottom-tabs` for web
   - Conditionally loads platform-specific modules

2. **Safe Area Handling**
   - Implements conditional `SafeAreaView` only on mobile platforms
   - Prevents web build errors from native-only modules

3. **Crypto Polyfills**
   - Added crypto polyfills for web compatibility
   - Resolves "Module not found: Can't resolve 'crypto'" errors

4. **Image Handling**
   - Platform-aware image picking implementation
   - Uses `expo-image-picker` on mobile
   - Web-based file input for browsers

5. **Animation Support**
   - Platform-specific animation configurations
   - Web-safe animations using CSS transitions
   - Native animations using React Native Animated API

### Platform Detection

The application automatically detects the platform at runtime and adjusts functionality accordingly:

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Web-specific implementation
} else {
  // Native-specific implementation
}
```

## 🚀 Running the Application

### Development Mode

**Mobile (Expo):**
```bash
npm start              # Start Expo server
npm run android        # Run on Android
npm run ios            # Run on iOS
```

**Web:**
```bash
npm run web            # Run on web browser
```

**Desktop (Tauri):**
```bash
npm run tauri dev      # Development mode
```

### Production Builds

**Mobile:**
```bash
npm run build          # Build for app stores
```

**Web:**
```bash
npm run build-web      # Production web build
```

**Desktop:**
```bash
npm run tauri build    # Production build
```

## 🔐 Firebase Security Rules

Add these to your Firestore security rules:

```javascript
match /trades/{document=**} {
  allow read, write: if request.auth.uid == resource.data.userId;
  allow create: if request.auth.uid != null;
}

match /checklist_template/{document=**} {
  allow read, write: if request.auth.uid == resource.data.userId;
  allow create: if request.auth.uid != null;
}

match /psychology_logs/{document=**} {
  allow read, write: if request.auth.uid == resource.data.userId;
  allow create: if request.auth.uid != null;
}

match /trades/{userId}/{allPaths=**} {
  allow read, write: if request.auth.uid == userId;
}
```

## 📈 Enhanced Features

### Improved Analytics Dashboard

Visualizes:

- Win rate (%)
- Average R:R (1:X)
- Profit factor
- Performance by pair
- Performance by session
- Performance by setup type
- Emotional correlation
- Deviation rate (%)
- Equity curve progression

### Advanced Psychology System

Daily logging:

- Emotional state (1-10)
- Notes describing mindset
- Deviations logged
- Confidence rating
- Session intentions
- Calendar heatmap visualization

### Real-time Calculations

All calculations happen client-side in real-time:

- Risk to Reward ratios
- Confluence scores
- Trade grading
- Performance metrics
- Equity curve generation

## 🧪 Testing

Cross-platform testing completed:

- ✅ iOS simulator
- ✅ Android emulator
- ✅ Chrome/Firefox/Safari browsers
- ✅ Windows/macOS/Linux desktop builds

## 📦 Dependencies

See `package.json` for complete list. Key packages:

- `firebase`: Backend services
- `@react-navigation/native`: Cross-platform navigation
- `react-native-gesture-handler`: Gesture support
- `react-native-reanimated`: Smooth animations
- `@tauri-apps/api`: Desktop integration
- `supabase`: Image storage

## 🚀 Deployment

**Android APK**: `npm run android` → build via Expo or Android Studio
**iOS IPA**: `npm run ios` → build via Xcode
**Web**: Deploy to Vercel/Netlify with `npm run build-web`
**Desktop**: Build with `npm run tauri build`

---

**Built for disciplined traders who want a performance operating system, not noise.**
