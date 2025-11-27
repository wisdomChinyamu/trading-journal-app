import "./src/polyfills/crypto";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { AppProvider } from "./src/context/AppContext";
import { TabNavigator } from "./src/navigation/TabNavigator";
import ThemeProvider from "./src/components/ThemeProvider";

// Conditional imports for native-only modules
let GestureHandlerRootView: any = React.Fragment;
let StatusBar: any = null;

if (Platform.OS !== "web") {
  const { GestureHandlerRootView: GHR } = require("react-native-gesture-handler");
  GestureHandlerRootView = GHR;
  const SB = require("expo-status-bar").StatusBar;
  StatusBar = SB;
}

export default function App() {
  /* 
  // Disabled: native desktop (Tauri) code — web/mobile only
  useEffect(() => {
    // Initialize Tauri APIs only in desktop environment
    const initializeTauri = async () => {
      // Only try to initialize Tauri in desktop environments
      if (Platform.OS === 'windows' || Platform.OS === 'macos' || Platform.OS === 'linux') {
        try {
          // Dynamic import to avoid bundling in web builds
          const { initializeTauri } = await import('./src/utils/tauriUtils');
          await initializeTauri();
        } catch (error) {
          console.warn('Failed to initialize Tauri:', error);
        }
      }
    };
    
    initializeTauri();
  }, []);
  */

  const RootView = GestureHandlerRootView;
  const rootProps = Platform.OS === "web" ? {} : { style: { flex: 1 } };

  return (
    <RootView {...rootProps}>
      <AppProvider>
        <ThemeProvider initial="dark">
          <NavigationContainer>
            {StatusBar && <StatusBar />}
            <TabNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </AppProvider>
    </RootView>
  );
}