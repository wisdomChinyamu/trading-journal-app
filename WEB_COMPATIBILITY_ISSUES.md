# Web Compatibility Issues - Complete Audit

**Last Updated:** November 20, 2025  
**Status:** 🔴 CRITICAL - 6 Major Blocking Issues Found

---

## 📋 Executive Summary

Your project has **6 critical breaking errors** preventing web builds and several architectural issues that compromise cross-platform compatibility. These stem from:

1. **Native-only imports** that don't exist on web (`@react-navigation/native-stack`, `react-native-safe-area-context`)
2. **require() statements** in dependencies that web bundlers can't resolve
3. **Expo-only APIs** (`expo-image-picker`) with no web fallback
4. **Missing polyfills** for crypto module
5. **Unsafe web access** to browser APIs in mobile code
6. **No platform-detection guards** in conditional code paths

---

## 🔴 CRITICAL ERRORS (Breaking Web Build)

### ERROR 1: Missing `react-native-safe-area-context` Module

**Status:** 🔴 BLOCKING WEB BUILD  
**Impact:** Web build fails immediately

#### Where It Breaks:

- `node_modules/@react-navigation/bottom-tabs/lib/module/views/BottomTabView.js:15`
- `node_modules/@react-navigation/elements/lib/module/Header/Header.js:12`
- `node_modules/@react-navigation/elements/lib/module/SafeAreaProviderCompat.js:10`
- `node_modules/@react-navigation/elements/lib/module/Screen.js:16`
- `node_modules/@react-navigation/elements/lib/module/useFrameSize.js:8`

#### Root Cause:

React Navigation's native stack navigator imports `react-native-safe-area-context`, which is a **native-only library** that doesn't work on web. The web build tries to bundle these imports and fails.

#### Exact Error Message:

```
ERROR in ./node_modules/@react-navigation/bottom-tabs/lib/module/views/BottomTabView.js:15
Module not found: Can't resolve 'react-native-safe-area-context'
```

#### Solution:

Replace `@react-navigation/native-stack` with `@react-navigation/stack` (which is web-compatible) OR create a platform-conditional navigation setup.

---

### ERROR 2: `require('crypto')` Not Resolvable

**Status:** 🔴 BLOCKING WEB BUILD  
**Impact:** Expo modules fail to initialize

#### Where It Breaks:

- `node_modules/expo-modules-core/build/uuid/uuid.web.js:9`

#### Exact Code:

```javascript
const cryptoObject =
  typeof crypto === "undefined" || typeof crypto.randomUUID === "undefined"
    ? require("crypto") // ← FAILS ON WEB
    : crypto;
```

#### Root Cause:

The `require('crypto')` statement uses Node.js `crypto` module which doesn't exist in browsers. The code assumes a fallback but doesn't check `Platform.OS === 'web'`.

#### Error Message:

```
ERROR in ./node_modules/expo-modules-core/build/uuid/uuid.web.js:9:8
Module not found: Can't resolve 'crypto'
```

#### Solution:

Add `crypto-browserify` polyfill to webpack config (already attempted but incomplete).

---

### ERROR 3: ImageUploader Uses `require()` with No Guard

**Status:** 🔴 CRITICAL LOGIC ERROR  
**Location:** `src/components/ImageUploader.tsx`, Line 30

#### Exact Code:

```tsx
const handleNative = async () => {
  try {
    // Use Expo ImagePicker if available (soft fallback)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ImagePicker = require("expo-image-picker"); // ← UNSAFE
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.cancelled) {
      onAdd(res.uri);
    }
  } catch (err) {
    console.warn("Image picker not available", err);
  }
};
```

#### Problem:

1. `require('expo-image-picker')` will be bundled into web build and fail
2. Using `require()` bypasses static analysis tools
3. No check for `Platform.OS === 'native'` before attempting dynamic import
4. Error handling swallows real errors silently

#### On Web:

- "Image picker not available" warning (misleading - it was never imported)
- Users can't upload images on web (falls through silently)

---

### ERROR 4: Navigation Uses Native-Only Stack Navigator

**Status:** 🔴 CRITICAL ARCHITECTURE ISSUE  
**Location:** `src/navigation/TabNavigator.tsx`, Line 13

#### Exact Code:

```tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack"; // ← NATIVE ONLY

const Stack = createNativeStackNavigator(); // ← BREAKS ON WEB
```

#### Problem:

`createNativeStackNavigator` is designed exclusively for native (iOS/Android) with native-only dependencies like `react-native-safe-area-context`.

**On Web:**

- Import fails → entire app fails to load
- No alternative navigation component provided
- Bottom tab navigation also fails due to transitive dependency

---

### ERROR 5: App.tsx Uses GestureHandlerRootView Without Platform Check

**Status:** 🔴 CRITICAL - UNNECESSARY ON WEB  
**Location:** `App.tsx`, Line 5

#### Exact Code:

```tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {" "}
      // ← Not needed on web
      {/* ... */}
    </GestureHandlerRootView>
  );
}
```

#### Problem:

`react-native-gesture-handler` is primarily for native platforms. While it has web support, wrapping the entire app is unnecessary and adds bundle weight.

**On Web:**

- Adds ~50KB to bundle size
- Unnecessary complexity
- Should be conditional

---

### ERROR 6: CalendarHeatmap & EquityChart Use Animated Without Web Fallback

**Status:** 🟡 MEDIUM PRIORITY - Breaks on Some Web Browsers  
**Locations:**

- `src/components/CalendarHeatmap.tsx`, Lines 120-135
- `src/components/EquityChart.tsx`, Lines 1

#### Exact Issues:

**CalendarHeatmap:**

```tsx
const handleDayCellPressIn = (dayKey: string) => {
  const scaleValue = getScaleAnimatedValue(dayKey);
  Animated.spring(scaleValue, {
    toValue: 0.95,
    useNativeDriver: true, // ← useNativeDriver not supported on web
    tension: 100,
    friction: 8,
  }).start();
};
```

**Problem:**

- `useNativeDriver: true` only works on native platforms
- On web, should use CSS animations or Framer Motion
- No platform check before setting `useNativeDriver`

**EquityChart:**

```tsx
import Svg, {
  Path,
  Rect,
  G,
  Line,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
```

- `react-native-svg` works on web but there are better alternatives for web (plain SVG)

---

## 🟡 WARNINGS (Non-Blocking But Risky)

### WARNING 1: ScreenLayout Uses SafeAreaView Without Web Guard

**Location:** `src/components/ScreenLayout.tsx`, Line 6

```tsx
import { SafeAreaView } from "react-native";

return (
  <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
    {/* ... */}
  </SafeAreaView>
);
```

**Issue:** `SafeAreaView` is a no-op on web but adds unnecessary wrapper. Should use conditional rendering.

---

### WARNING 2: Platform.OS Check in ScreenLayout But Incomplete

**Location:** `src/components/ScreenLayout.tsx`, Line 12

```tsx
paddingTop: Platform.OS === 'android' ? 12 : 16,
```

**Issue:** Good pattern but incomplete - should handle web separately:

```tsx
paddingTop: Platform.OS === 'android' ? 12 : Platform.OS === 'web' ? 0 : 16,
```

---

### WARNING 3: package.json Still References Removed Dependencies

**Location:** `package.json`, Lines 15-17

```json
"@tauri-apps/api": "^2.9.0",
"@tauri-apps/cli": "^2.9.4",
```

**Issue:** According to `DEPENDENCY_UPDATES.md`, these were removed as incompatible with Expo, but they're still in package.json. This causes confusion and bundle bloat.

---

### WARNING 4: expo-image-picker Has No Web Fallback

**Location:** `package.json`, Line 25

```json
"expo-image-picker": "^17.0.8",
```

**Usage:** `src/components/ImageUploader.tsx`, Line 30 (no web alternative)

**Issue:**

- `expo-image-picker` doesn't work on web
- Code tries to use it anyway
- Error is silently swallowed
- Users on web get broken image upload

---

### WARNING 5: expo.config.js Uses require() (Node-Only)

**Location:** `expo.config.js`, Line 2

```javascript
module.exports = {
  ...require("./app.json").expo,
};
```

**Issue:** Uses `require()` which won't work in web bundlers if this file is ever processed by webpack.

---

## 🔍 DETAILED DEPENDENCY ANALYSIS

### Native-Only Dependencies That Break Web:

| Package                          | Used For     | Web Compatible | Status                                   |
| -------------------------------- | ------------ | -------------- | ---------------------------------------- |
| `@react-navigation/native-stack` | Navigation   | ❌ NO          | Replace with `@react-navigation/stack`   |
| `react-native-safe-area-context` | Safe area    | ⚠️ PARTIAL     | Use only on native with guards           |
| `expo-image-picker`              | Image upload | ❌ NO          | Use HTML `<input>` fallback              |
| `react-native-gesture-handler`   | Gestures     | ✅ YES         | Use conditionally to save bundle         |
| `react-native-reanimated`        | Animations   | ✅ YES         | Use with `useNativeDriver: false` on web |
| `@supabase/supabase-js`          | Storage      | ✅ YES         | Web-compatible (already)                 |
| `firebase`                       | Backend      | ✅ YES         | Web-compatible (already)                 |

---

## 🛠️ ARCHITECTURE PROBLEMS

### Problem 1: No Platform-Conditional Navigation

**Current:** All screens use native stack navigation everywhere
**Issue:** Native stack imports are bundled into web build

**Should Be:**

```tsx
// Conditional navigation based on platform
if (Platform.OS === "web") {
  // Use React Router or simple component switching
} else {
  // Use @react-navigation/native-stack
}
```

---

### Problem 2: No Web Entry Point

**Current:** Single `App.tsx` for all platforms
**Issue:** Entry point tries to initialize native-only modules

**Should Be:**

- `App.native.tsx` - For iOS/Android
- `App.web.tsx` - For web (uses React Router or alternate nav)
- Or conditional imports inside `App.tsx`

---

### Problem 3: Image Upload Has No Web Strategy

**Current:** Falls back to `require()` which fails silently
**Issue:** Users on web can't upload images

**Should Be:**

```tsx
if (Platform.OS === "web") {
  // Use HTML <input type="file">
} else {
  // Use expo-image-picker
}
```

---

### Problem 4: Animations Not Web-Safe

**Current:** Uses `useNativeDriver: true` everywhere
**Issue:** Crashes on web browsers that don't support native driver

**Should Be:**

```tsx
Animated.spring(scaleValue, {
  toValue: 0.95,
  useNativeDriver: Platform.OS !== "web", // False on web
  tension: 100,
  friction: 8,
}).start();
```

---

## 📊 Build Process Analysis

### Webpack Configuration Status:

**File:** `webpack.config.js`

**What's Working:** ✅

- Crypto polyfill configured
- Buffer polyfill configured
- Stream polyfill configured
- Process polyfill configured

**What's Missing:** ❌

- `react-native-safe-area-context` has no web fallback
- No polyfill can help; the module must be replaced
- No alias to redirect native imports to web equivalents

---

## 🔄 Dependency Resolution Flow (Why It Fails)

```
npm run web
  ↓
expo start --web (uses webpack)
  ↓
webpack bundles App.tsx
  ↓
App imports TabNavigator
  ↓
TabNavigator imports createNativeStackNavigator
  ↓
@react-navigation/native-stack imported
  ↓
@react-navigation/native-stack imports from react-native-safe-area-context
  ↓
webpack tries to bundle react-native-safe-area-context
  ↓
Safe-area-context DOESN'T HAVE a .web.js fallback
  ↓
❌ WEBPACK FAILS: "Can't resolve 'react-native-safe-area-context'"
```

---

## 📝 Summary Table

| Issue                                    | Severity    | Type              | File(s)                     | Solution                                                   |
| ---------------------------------------- | ----------- | ----------------- | --------------------------- | ---------------------------------------------------------- |
| `react-native-safe-area-context` missing | 🔴 CRITICAL | Import Error      | TabNavigator, multiple deps | Use `@react-navigation/stack` instead of native-stack      |
| `require('crypto')` fails                | 🔴 CRITICAL | Module Resolution | expo-modules-core           | Use crypto-browserify (already configured but not working) |
| ImageUploader dynamic require            | 🔴 CRITICAL | Logic Error       | ImageUploader.tsx:30        | Add Platform check before require()                        |
| GestureHandlerRootView unnecessary       | 🔴 CRITICAL | Bundle Bloat      | App.tsx:5                   | Make conditional on Platform.OS                            |
| Animated `useNativeDriver: true`         | 🟡 MEDIUM   | Animation API     | CalendarHeatmap:135         | Add Platform check                                         |
| ScreenLayout SafeAreaView                | 🟡 MEDIUM   | Component         | ScreenLayout.tsx:6          | Make conditional or remove on web                          |
| Missing web navigation strategy          | 🟡 MEDIUM   | Architecture      | TabNavigator.tsx            | Implement web-safe navigation                              |
| Incomplete Platform.OS checks            | 🟡 MEDIUM   | Code Quality      | ScreenLayout.tsx:12         | Add explicit 'web' case                                    |
| Unused Tauri dependencies                | 🟡 MEDIUM   | Dependencies      | package.json:15-17          | Remove completely                                          |
| expo-image-picker no web support         | 🟡 MEDIUM   | Feature           | ImageUploader.tsx           | Add HTML input fallback                                    |

---

## ✅ What's Working Well

- ✅ Firebase config is universal (web-compatible)
- ✅ Supabase is web-compatible
- ✅ Theme system is platform-agnostic
- ✅ Types/interfaces are universal
- ✅ Calculations/utilities are universal
- ✅ Webpack config has polyfills for Node modules
- ✅ Platform.OS checks are used in some places (ScreenLayout)

---

## 🎯 Priority Fix Order

1. **HIGHEST:** Replace `@react-navigation/native-stack` with web-compatible navigation
2. **HIGHEST:** Add Platform checks to ImageUploader
3. **HIGH:** Fix Animated `useNativeDriver` checks
4. **HIGH:** Make GestureHandlerRootView conditional
5. **MEDIUM:** Clean up removed dependencies from package.json
6. **MEDIUM:** Add explicit web platform checks everywhere
7. **LOW:** Optimize bundle by removing unused native-only wrappers

---
