import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { initStorage } from "./lib/storage.js";
import { isNative } from "./lib/nativeInit.js";

// Hydrate the storage cache before the first render — on native this is a real async
// Preferences round-trip, so App's synchronous lazy useState reads (loadData, theme,
// tour-seen flag) can't run correctly until this resolves. The splash screen (native)
// or the plain background color (web) covers this brief wait.
initStorage().then(() => {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  // A service worker inside the Capacitor WebView would intercept and cache the app's
  // own bundled assets, fighting native's asset loading and risking stale-app bugs —
  // so it's only registered for the real web/PWA build.
  if (!isNative) {
    import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: true }));
  }
});
