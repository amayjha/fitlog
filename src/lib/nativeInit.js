// Native-only platform adapters — status bar, splash screen, hardware back button. Every
// raw Capacitor plugin call for these lives here so App.jsx (which knows what "back" and
// "current theme" actually mean for this app) doesn't need to import native plugins
// directly. All exports are no-ops on web.
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { App as CapacitorApp } from "@capacitor/app";

export const isNative = Capacitor.isNativePlatform();

// Classic is a light/cream theme (needs dark status-bar icons); Dark and Mono are both
// dark (need light icons). setBackgroundColor is Android-only — iOS's status bar is an
// overlay, styled only via setStyle.
const STATUS_BAR_BG = { classic: "#F5EFE8", dark: "#0B1220", mono: "#0A0A0A" };
const STATUS_BAR_LIGHT_ICONS = { classic: false, dark: true, mono: true };

export async function applyStatusBarForTheme(themeName) {
  if (!isNative) return;
  try {
    await StatusBar.setStyle({ style: STATUS_BAR_LIGHT_ICONS[themeName] ? Style.Light : Style.Dark });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: STATUS_BAR_BG[themeName] || STATUS_BAR_BG.dark });
    }
  } catch {
    // Best-effort — a missing plugin or unsupported platform shouldn't block the app.
  }
}

// Splash auto-hide is disabled in capacitor.config.json so this can cover the async
// Preferences hydration (see lib/storage.js) that runs before the first real render.
export async function hideSplashScreen() {
  if (!isNative) return;
  try { await SplashScreen.hide(); } catch {}
}

// Returns an unsubscribe function, so callers can re-register when the handler's
// closed-over state changes (e.g. current overlay/tab) without leaking listeners.
export function onBackButton(handler) {
  if (!isNative) return () => {};
  const sub = CapacitorApp.addListener("backButton", handler);
  return () => { sub.remove(); };
}

export function exitApp() {
  if (isNative) CapacitorApp.exitApp();
}
