# Web Compatibility Checklist - Production Ready

**Last Updated:** November 20, 2025  
**Status:** ✅ Reference Guide for Cross-Platform Development

Use this checklist when writing code to ensure your entire project remains web-compatible.

---

## 🎯 Pre-Development Checklist

Before writing ANY new component or feature:

- [ ] Check if the feature requires platform-specific APIs
- [ ] If yes, plan Platform.OS checks before coding
- [ ] Review `WEB_COMPATIBILITY_ISSUES.md` for known problems
- [ ] Test on web build: `npm run web` (not just native)
- [ ] Verify no `require()` statements outside of conditional blocks

---

## ✅ Core Compatibility Rules

### Rule 1: Never Use require() Outside of Conditional Blocks

**❌ BAD:**

```tsx
const ImagePicker = require('expo-image-picker');  // Fails on web

const handlePick = async () => {
  const res = await ImagePicker.launchImageLibraryAsync(...);
};
```

**✅ GOOD:**

```tsx
const handlePick = async () => {
  if (Platform.OS === 'web') {
    // Use web alternative
    const input = document.createElement('input');
    // ...
  } else {
    // Use native package
    const ImagePicker = await import('expo-image-picker');
    const res = await ImagePicker.launchImageLibraryAsync(...);
  }
};
```

---

### Rule 2: Always Import Platform

**In Every File That Checks Platform:**

```tsx
import { Platform } from 'react-native';

// Then use:
if (Platform.OS === 'web') { ... }
if (Platform.OS === 'ios') { ... }
if (Platform.OS === 'android') { ... }
if (Platform.OS === 'native') { ... }  // Both iOS and Android
```

---

### Rule 3: Use Platform.OS in Three Main Scenarios

#### Scenario A: Conditional Imports

```tsx
// Only import native-specific packages when not on web
let GestureHandlerRootView: any = React.Fragment;
if (Platform.OS !== "web") {
  const {
    GestureHandlerRootView: GHR,
  } = require("react-native-gesture-handler");
  GestureHandlerRootView = GHR;
}
```

#### Scenario B: Platform-Specific UI

```tsx
// Different UI for different platforms
return (
  <View>
    {Platform.OS === "web" && <WebHeader />}
    {Platform.OS !== "web" && <MobileHeader />}
  </View>
);
```

#### Scenario C: Platform-Specific Styling

```tsx
const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === "android" ? 12 : Platform.OS === "web" ? 0 : 16,
    // Web: 0, iOS: 16, Android: 12
  },
});
```

---

### Rule 4: Safe Animation Configuration

**❌ BAD:**

```tsx
Animated.spring(value, {
  toValue: 0.95,
  useNativeDriver: true, // CRASHES ON WEB
}).start();
```

**✅ GOOD:**

```tsx
Animated.spring(value, {
  toValue: 0.95,
  useNativeDriver: Platform.OS !== "web", // true on native, false on web
}).start();
```

---

### Rule 5: Graceful Error Handling for Platform APIs

**❌ BAD:**

```tsx
// Crashes silently, user doesn't know what happened
try {
  const result = await nativeOnlyAPI();
  onSuccess(result);
} catch (err) {
  console.warn("Error", err); // Swallows the real problem
}
```

**✅ GOOD:**

```tsx
try {
  if (Platform.OS === "web") {
    throw new Error("API not available on web");
  }
  const result = await nativeOnlyAPI();
  onSuccess(result);
} catch (err) {
  if (Platform.OS === "web") {
    console.info("This API is not available on web, using fallback...");
    onWebFallback();
  } else {
    console.error("Unexpected error:", err);
  }
}
```

---

### Rule 6: Browser API Access Only on Web

**❌ BAD:**

```tsx
// This code runs on all platforms, will crash on native
const input = document.createElement("input");
```

**✅ GOOD:**

```tsx
if (Platform.OS === "web") {
  const input = document.createElement("input");
  input.type = "file";
  // ... rest of web-specific code
}
```

---

## 🔍 File-by-File Checklist

### ✅ App.tsx

- [ ] Import `Platform` from `react-native`
- [ ] GestureHandlerRootView is conditional (not always imported)
- [ ] StatusBar is conditional on web
- [ ] No native-only modules at top level
- [ ] NavigationContainer works with both native and web navigation

### ✅ Navigation (TabNavigator.tsx)

- [ ] Uses `createNativeStackNavigator` (fine, but handles safe-area-context issues)
- [ ] Modal presentation is adjusted for web (`presentation: Platform.OS === 'web' ? 'card' : 'modal'`)
- [ ] Header styling is platform-aware
- [ ] No direct imports of `react-native-safe-area-context`

### ✅ Components (ImageUploader.tsx)

- [ ] Platform.OS check before dynamic imports
- [ ] Web fallback uses `document.createElement('input')`
- [ ] Native path uses async import
- [ ] Error handling is explicit about platform context
- [ ] Button text changes based on platform (`Platform.OS === 'web' ? 'Choose Image' : 'Upload Screenshot'`)

### ✅ Animations (CalendarHeatmap.tsx, EquityChart.tsx)

- [ ] `useNativeDriver: Platform.OS !== 'web'` on all Animated calls
- [ ] No CSS-only features (all animations compatible with RN)
- [ ] Dimensions listener works on web (uses Dimensions.get())
- [ ] Touch handlers work on web (using Pressable, not just onPress)

### ✅ Layout (ScreenLayout.tsx)

- [ ] SafeAreaView is conditional
- [ ] Padding is platform-specific
- [ ] Container flex layout works on all platforms
- [ ] Background color is properly set

### ✅ Theme (theme.ts)

- [ ] `isWeb` constant is defined (`Platform.OS === 'web'`)
- [ ] Color values are hex/rgb (no platform-specific colors)
- [ ] Breakpoints defined for responsive design
- [ ] Theme colors work in light and dark modes

### ✅ Context (AppContext.tsx)

- [ ] No platform-specific logic (universal)
- [ ] Type definitions work on all platforms
- [ ] Action creators don't reference platform APIs

### ✅ Services (Firebase, Supabase)

- [ ] Firebase config is universal (web-compatible)
- [ ] Supabase is web-compatible
- [ ] No require() statements
- [ ] No file system APIs (use Supabase/Firebase storage instead)

### ✅ Utils (calculations.ts, chartingUtils.ts)

- [ ] Pure functions, no platform references
- [ ] No file system access
- [ ] No require() statements
- [ ] Can be tested independently

### ✅ Types (types.ts)

- [ ] No platform-specific types
- [ ] All interfaces are universal
- [ ] Enums and constants are cross-platform

### ✅ Screens (All)

- [ ] No native-only imports at top level
- [ ] Platform checks before using native APIs
- [ ] Navigation works on both native and web
- [ ] Touch handlers use Pressable (not native-only GestureHandler)
- [ ] Keyboard handling is cross-platform

---

## 📦 Package.json Checklist

- [ ] **Remove non-compatible packages:**

  - ❌ `@tauri-apps/api` (Tauri is desktop-only, not compatible with Expo)
  - ❌ `@tauri-apps/cli` (same reason)

- [ ] **Keep web-compatible packages:**

  - ✅ `@react-navigation/native` (has web support)
  - ✅ `@react-navigation/bottom-tabs` (has web support)
  - ✅ `@react-navigation/native-stack` (has web support via core components)
  - ✅ `@react-navigation/stack` (web-safe alternative for stacks)
  - ✅ `firebase` (fully web-compatible)
  - ✅ `@supabase/supabase-js` (fully web-compatible)
  - ✅ `react-native-svg` (works on web)
  - ✅ `react-native-reanimated` (works on web with config)
  - ✅ `react-native-gesture-handler` (has web support, but use conditionally)

- [ ] **Polyfills installed:**
  - ✅ `crypto-browserify`
  - ✅ `buffer`
  - ✅ `stream-browserify`
  - ✅ `process`
  - ✅ `util`
  - ✅ `vm-browserify`
  - ✅ `path-browserify`

---

## 🔧 Build Configuration Checklist

### webpack.config.js

- [ ] ✅ Crypto polyfill configured
- [ ] ✅ Buffer polyfill configured
- [ ] ✅ Stream polyfill configured
- [ ] ✅ Process polyfill configured
- [ ] ✅ Util polyfill configured
- [ ] ✅ VM polyfill configured
- [ ] ✅ Path polyfill configured
- [ ] ⚠️ No fallback for `react-native-safe-area-context` (architecture issue, not webpack)

### tsconfig.json

- [ ] ✅ Strict mode enabled
- [ ] ✅ Proper target (ES2020 or later)
- [ ] ✅ Platform resolution works (uses expo/tsconfig.base)

### expo.config.js

- [ ] ✅ No dynamic requires (or handled properly)
- [ ] ✅ Web configuration defined (if custom)

---

## 🧪 Testing Checklist

Before deploying to production:

### Web Build Testing

```bash
npm run web
```

- [ ] App starts without console errors
- [ ] Navigation works (all tabs)
- [ ] Dashboard loads with theme
- [ ] Can add trades
- [ ] Calendar heatmap renders
- [ ] Charts display correctly
- [ ] Image upload works (uses file picker)
- [ ] Theme toggle works
- [ ] Settings screen loads

### Native Build Testing

```bash
npm run android      # or iOS
npm start
```

- [ ] App starts in Expo
- [ ] All features work as before
- [ ] Image picker opens native picker (not file dialog)
- [ ] Gestures work smoothly
- [ ] Animations are smooth (60fps)

### Cross-Platform Testing Checklist

- [ ] Same data appears on web and native
- [ ] Theme colors match
- [ ] Layouts respond to screen size on both platforms
- [ ] No console warnings about platform APIs
- [ ] No "require is not defined" errors

---

## 🔴 Critical "Do Not Do" List

### ❌ Never Do These Things

1. **Import native-only libraries at the top level:**

   ```tsx
   // WRONG - will fail on web
   import { GestureHandlerRootView } from "react-native-gesture-handler";
   ```

2. **Use require() without Platform check:**

   ```tsx
   // WRONG - bundler can't resolve at build time
   const picker = require("expo-image-picker");
   ```

3. **Access document/window without Platform check:**

   ```tsx
   // WRONG - throws ReferenceError on native
   const element = document.getElementById("root");
   ```

4. **Use useNativeDriver: true on web:**

   ```tsx
   // WRONG - crashes animation on web
   Animated.timing(value, {
     useNativeDriver: true, // ❌
   }).start();
   ```

5. **Use native-only UI components unconditionally:**

   ```tsx
   // WRONG - SafeAreaView is a no-op on web
   return <SafeAreaView>{/* all your content */}</SafeAreaView>;
   ```

6. **Mix platform APIs without guards:**
   ```tsx
   // WRONG - crashes on mobile
   if (somethingTrue) {
     navigator.geolocation.getCurrentPosition(...);
   }
   ```

---

## ✅ Recommended Pattern Library

### Pattern 1: Platform-Conditional Imports

```tsx
import { Platform } from "react-native";

let NativeComponent: React.ComponentType<any>;

if (Platform.OS !== "web") {
  NativeComponent = require("native-only-package").Component;
} else {
  NativeComponent = ({ children }: any) => <>{children}</>;
}

export default NativeComponent;
```

### Pattern 2: Platform-Specific UI

```tsx
function MyComponent() {
  if (Platform.OS === "web") {
    return <WebVersion />;
  }
  return <NativeVersion />;
}
```

### Pattern 3: Async Platform-Safe Import

```tsx
async function handleNativeFeature() {
  if (Platform.OS === "web") {
    handleWebVersion();
    return;
  }

  try {
    const module = await import("native-package");
    await module.doSomething();
  } catch (err) {
    console.error("Native feature not available:", err);
  }
}
```

### Pattern 4: Platform-Aware Styling

```tsx
const styles = StyleSheet.create({
  container: {
    padding: Platform.select({
      web: 24,
      android: 12,
      ios: 16,
      default: 16,
    }),
  },
});
```

### Pattern 5: Web-Safe Animation

```tsx
Animated.spring(value, {
  toValue: targetValue,
  useNativeDriver: Platform.OS !== "web",
  tension: 100,
  friction: 8,
}).start();
```

### Pattern 6: Conditional Rendering with Fallback

```tsx
function UploadComponent() {
  const handlePress = () => {
    if (Platform.OS === "web") {
      // Use HTML file input
      const input = document.createElement("input");
      input.type = "file";
      input.click();
    } else {
      // Use native picker
      importAndUseImagePicker();
    }
  };

  return <Button onPress={handlePress} title="Upload" />;
}
```

---

## 🚀 Deployment Checklist

### Before Web Deployment

```bash
# Test locally
npm run web
# Check for warnings/errors in browser console

# Build production
npm run web -- --production

# Check bundle size
npx webpack-bundle-analyzer dist/stats.json
```

- [ ] No "require is not defined" errors
- [ ] No console warnings about platform
- [ ] All features working
- [ ] Images loading correctly
- [ ] Theme works
- [ ] Navigation works
- [ ] Database operations (Firebase/Supabase) working

### Before Native Deployment

```bash
# Test locally
npm start
# or
npm run android / npm run ios

# Build for distribution
eas build --platform android  # or ios
```

- [ ] No warnings about missing platform checks
- [ ] Native performance is good (60fps animations)
- [ ] Platform-specific features working (image picker)
- [ ] All database operations working

---

## 📊 Compliance Scoring

Use this to track your project's cross-platform health:

| Category         | Check                       | Status | Score |
| ---------------- | --------------------------- | ------ | ----- |
| **Imports**      | No require() at top level   | ✅/❌  | 10pts |
| **Imports**      | Native imports conditional  | ✅/❌  | 10pts |
| **Platform**     | Platform.OS checks exist    | ✅/❌  | 10pts |
| **Animations**   | useNativeDriver conditional | ✅/❌  | 10pts |
| **Components**   | SafeAreaView conditional    | ✅/❌  | 5pts  |
| **Browser APIs** | document/window guarded     | ✅/❌  | 10pts |
| **Dependencies** | No Tauri in package.json    | ✅/❌  | 10pts |
| **Build**        | Webpack config complete     | ✅/❌  | 10pts |
| **Testing**      | Web build passes            | ✅/❌  | 15pts |
| **Testing**      | Native build passes         | ✅/❌  | 10pts |

**Target Score: 100/100** ✅

---

## 🔗 Reference Documents

Related documents in this project:

- **WEB_COMPATIBILITY_ISSUES.md** - Detailed analysis of all breaking issues
- **CROSS_PLATFORM_FIXES.md** - Code rewrites for all problematic files
- **IMPLEMENTATION_STATUS.md** - Original project status
- **README.md** - Project overview

---

## 🆘 Troubleshooting Quick Reference

### "Cannot find module 'react-native-safe-area-context'"

- **Cause:** Using native-stack navigator on web
- **Fix:** Use `@react-navigation/stack` or add Platform check
- **Reference:** WEB_COMPATIBILITY_ISSUES.md, ERROR 1

### "require is not defined"

- **Cause:** Dynamic require() at top level or without Platform check
- **Fix:** Wrap in `if (Platform.OS !== 'web')` or use async import
- **Reference:** WEB_COMPATIBILITY_ISSUES.md, ERROR 3

### "Animated: useNativeDriver only works with native code"

- **Cause:** `useNativeDriver: true` on web
- **Fix:** Change to `useNativeDriver: Platform.OS !== 'web'`
- **Reference:** WEB_COMPATIBILITY_ISSUES.md, ERROR 5

### "Image picker opens file dialog instead of native picker"

- **Cause:** Platform check working correctly (it's a feature, not a bug)
- **Fix:** This is correct behavior - web uses HTML, native uses picker
- **Reference:** CROSS_PLATFORM_FIXES.md, Section 3

### App crashes with "document is not defined"

- **Cause:** Browser API accessed on native platform
- **Fix:** Wrap in `if (Platform.OS === 'web') { }`
- **Reference:** Rule 6 in this checklist

---

## 📞 Getting Help

If you encounter cross-platform issues:

1. **Check this checklist** - Most common issues listed
2. **Read WEB_COMPATIBILITY_ISSUES.md** - Detailed diagnosis
3. **Check CROSS_PLATFORM_FIXES.md** - Ready-made solutions
4. **Test specific platform:** `npm run web` vs `npm start`
5. **Check console errors** - Copy exact error message
6. **Search error message** in these documents

---

**✅ Final Status: Your project is ready for cross-platform development!**

Follow these rules, use the provided patterns, and your app will work seamlessly on Web, iOS, Android, and Tauri Desktop.
