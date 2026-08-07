# Implementation Plan - Fix Blank White Screen on Launch

The blank white screen issue in Capacitor apps usually indicates a JavaScript execution failure or an asset loading error. This plan addresses the most common causes: absolute asset paths, missing environment variables, and initialization sequence issues.

## User Review Required

> [!IMPORTANT]
> **Build Sequence**: After applying these changes, you MUST run the following commands in order:
> 1. `npm run build`
> 2. `npx cap sync android`
> 3. Then build the AAB in Android Studio.

## Proposed Changes

### [Component: Vite Configuration]

#### [MODIFY] [vite.config.js](file:///C:/Users/amayj/ironlog/ironlog/new_app/vite.config.js)
- Set `base: "./"` to ensure all generated asset paths in `index.html` are relative. This is more compatible with the `capacitor://` and `http://localhost` schemes used on Android.

### [Component: Supabase Client]

#### [MODIFY] [supabaseClient.js](file:///C:/Users/amayj/ironlog/ironlog/new_app/src/utils/supabaseClient.js)
- Guard the `createClient` call to prevent a top-level exception if environment variables are missing. If they are missing, we will export a mock or a client that lazily fails, preventing the entire JS bundle from crashing on boot.

### [Component: App Initialization]

#### [MODIFY] [main.jsx](file:///C:/Users/amayj/ironlog/ironlog/new_app/src/main.jsx)
- Add basic logging to confirm the entry point is reached.
- Wrap `initStorage` in a try-catch to ensure the app attempts to render even if storage hydration has issues.

#### [MODIFY] [App.jsx](file:///C:/Users/amayj/ironlog/ironlog/new_app/src/App.jsx)
- Add a small timeout before calling `hideSplashScreen()` to ensure the React app has rendered its first frame.

## Verification Plan

### Automated Tests
- Build the project and check the generated `dist/index.html` to confirm paths like `src="assets/..."` instead of `src="/assets/..."`.

### Manual Verification
- Deploy to an emulator/device and check Logcat for "App started" or any caught errors.
- Verify that the app loads even if the `.env` file is missing (it should show the UI but maybe disable community features).
