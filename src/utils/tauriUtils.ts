// DESKTOP-ONLY MODULE: `src/utils/tauriUtils.ts`
// The original implementation used Tauri APIs. Those imports and runtime
// calls are intentionally commented out so web and mobile builds never
// attempt to load desktop-native dependencies.

/*
import { Platform } from "react-native";

let tauriAPI: any = null;

// Dynamically import Tauri APIs only on non-web platforms
export const initializeTauri = async () => {
  const isTauriEnv =
    Platform.OS !== "web" &&
    (window.location.protocol === "tauri:" ||
      (window as any).__TAURI__ !== undefined);

  if (isTauriEnv) {
    try {
      // Prevent bundlers (webpack) from trying to bundle Tauri APIs for web builds
      // @ts-ignore
      tauriAPI = await import(/* webpackIgnore: true */ "@tauri-apps/api");
      console.log("Tauri API initialized successfully");
    } catch (error) {
      console.warn("Failed to initialize Tauri API:", error);
    }
  }
};

export const getTauriAPI = () => {
  return tauriAPI;
};

// Utility functions for common Tauri operations
export const isTauri = () => {
  return tauriAPI !== null;
};

export const openTauriDialog = async (options?: any) => {
  if (!tauriAPI) return null;

  try {
    const result = await tauriAPI.dialog.open(options);
    return result;
  } catch (error) {
    console.error("Error opening Tauri dialog:", error);
    return null;
  }
};

export const sendTauriEvent = async (event: string, payload?: any) => {
  if (!tauriAPI) return;

  try {
    await tauriAPI.event.emit(event, payload);
  } catch (error) {
    console.error("Error sending Tauri event:", error);
  }
};
*/

// FALLBACK IMPLEMENTATIONS FOR WEB & MOBILE
// These are no-ops or safe fallbacks that ensure the rest of the app
// can import these helpers without triggering desktop-only code.
export const initializeTauri = async () => {
  // intentionally empty for web/mobile
  return null;
};

export const getTauriAPI = () => null;

export const isTauri = () => false;

export const openTauriDialog = async (_options?: any) => null;

export const sendTauriEvent = async (_event: string, _payload?: any) => {};
