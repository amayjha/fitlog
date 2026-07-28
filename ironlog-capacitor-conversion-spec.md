# Ironlog — PWA to Capacitor Android Conversion Spec

Convert the existing Ironlog React PWA in this repo into a Capacitor-wrapped Android
app while keeping the web/PWA build fully working. Do not rewrite UI code — this is a
packaging and platform-adapter task.

**First step: inspect the repo.** Confirm the bundler (assumed Vite), the build output
directory (assumed `dist`), how the service worker / PWA manifest is registered, and
every place the code touches `localStorage`, `navigator.share`, or browser-only APIs.
List findings before making changes.

---

## 1. Install and initialize Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init Ironlog com.amay.ironlog --web-dir=dist
npm run build
npx cap add android
npx cap sync
```

- Use appId `com.amay.ironlog` unless a different one is already reserved.
- Commit the generated `/android` directory. Add Android build artifacts
  (`/android/app/build`, `.gradle`, `local.properties`, `*.keystore`) to `.gitignore`.
- In `capacitor.config.ts`, set `android.allowMixedContent: false` and app name
  "Ironlog". Do NOT set a `server.url` — the app must bundle the web assets, not
  point at the Railway deployment.

## 2. Storage adapter (critical)

Install `@capacitor/preferences`. Create `src/lib/storage.js` exposing:

```ts
getItem(key): Promise<string | null>
setItem(key, value): Promise<void>
removeItem(key): Promise<void>
```

- On native (`Capacitor.isNativePlatform()`): use Preferences.
- On web: use localStorage (keep the PWA behavior identical).
- Refactor ALL existing localStorage reads/writes in the app to go through this
  adapter. Because the adapter is async and current code is sync, load all app data
  once at startup into app state (or a small in-memory cache inside the adapter that
  hydrates before first render) rather than sprinkling `await` through components.

### One-time migration
On first native launch, if Preferences is empty, check WebView localStorage for
existing Ironlog keys and copy them into Preferences, then mark migration done.
Also add a manual "Export data / Import data" (JSON file download + paste/upload)
in settings if one doesn't already exist — this is the cross-device escape hatch.

## 3. Native polish

- `@capacitor/status-bar`: dark background matching the app's iron-grey, light icons.
- `@capacitor/splash-screen`: solid app-background splash, auto-hide after load.
- Android back button: `App.addListener('backButton', ...)` — navigate back through
  app routes; exit only from the home screen.
- Replace direct `navigator.share` usage (recap card export) with `@capacitor/share`
  + `@capacitor/filesystem` on native (write PNG to cache dir, share the file URI);
  keep the web path as-is.
- Ensure the service worker registration is skipped on native
  (`if (!Capacitor.isNativePlatform())`) — Capacitor serves assets locally and a SW
  inside the WebView causes stale-cache bugs.
- Safe-area: add `viewport-fit=cover` and CSS `env(safe-area-inset-*)` padding on the
  top bar and bottom nav so nothing hides under the status bar or gesture area.

## 4. Scripts

Add to package.json:

```json
"android:sync": "npm run build && npx cap sync android",
"android:open": "npx cap open android"
```

## 5. What NOT to do

- Don't remove or break the PWA/web deployment — web and native share one codebase.
- Don't attempt signed release builds, keystore creation, or Play Console setup —
  those are manual steps done in Android Studio by the developer.
- Don't upgrade unrelated dependencies.

## Acceptance criteria

1. `npm run android:sync` completes cleanly; `/android` opens and builds a debug APK
   in Android Studio without manual fixes.
2. Web build still deploys and behaves exactly as before, including PWA install.
3. All workout data flows through the storage adapter; grep shows zero direct
   `localStorage` calls outside `src/lib/storage.js`.
4. First native launch migrates existing WebView localStorage data if present.
5. Recap card share works on native via the native share sheet.
6. Back button navigates correctly; status bar and splash match app theming.
