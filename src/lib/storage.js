// Storage adapter — localStorage on web (keeps PWA behavior identical), Capacitor
// Preferences on native. Preferences is unavoidably async (a native bridge call), but
// nearly all call sites in this app were written against synchronous localStorage
// (lazy useState initializers, plain reads inside render). Rather than threading await
// through every one of them, this module hydrates every existing key into an in-memory
// cache once at boot (see initStorage, called from App.jsx before the real UI renders),
// then serves getItem/getItemSync straight from that cache. Writes update the cache
// immediately and persist to the underlying store in the background.
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const MIGRATION_FLAG = "fitlog:migrated-to-preferences";

export const isNative = Capacitor.isNativePlatform();

const cache = new Map();
let initPromise = null;

// One-time copy of whatever's already in the WebView's localStorage into Preferences,
// so upgrading an existing native install doesn't lose a user's workout history.
async function migrateFromWebView() {
  const { value: done } = await Preferences.get({ key: MIGRATION_FLAG });
  if (done === "1") return;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key === null || key === MIGRATION_FLAG) continue;
    const value = localStorage.getItem(key);
    if (value !== null) await Preferences.set({ key, value });
  }
  await Preferences.set({ key: MIGRATION_FLAG, value: "1" });
}

// Call once, before rendering the real app. Resolves once every existing key (native:
// Preferences, after migrating; web: localStorage) is loaded into the in-memory cache.
export async function initStorage() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (isNative) {
      await migrateFromWebView();
      const { keys } = await Preferences.keys();
      await Promise.all(
        keys.map(async (key) => {
          const { value } = await Preferences.get({ key });
          cache.set(key, value);
        })
      );
    } else {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== null) cache.set(key, localStorage.getItem(key));
      }
    }
  })();
  return initPromise;
}

// Synchronous read from the hydrated cache — for lazy useState initializers and other
// call sites that ran synchronously against localStorage before. Only valid to call
// after initStorage() has resolved (App.jsx gates first render on that).
export function getItemSync(key) {
  return cache.has(key) ? cache.get(key) : null;
}

// Promise-based API matching the native Preferences shape, for call sites that are
// already async or don't run at initial render.
export async function getItem(key) {
  return getItemSync(key);
}

export async function setItem(key, value) {
  cache.set(key, value);
  if (isNative) await Preferences.set({ key, value });
  else localStorage.setItem(key, value);
}

export async function removeItem(key) {
  cache.delete(key);
  if (isNative) await Preferences.remove({ key });
  else localStorage.removeItem(key);
}
