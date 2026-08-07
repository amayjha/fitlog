import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { initStorage } from "./lib/storage.js";
import { isNative } from "./lib/nativeInit.js";

const rootElement = document.getElementById("root");

const render = () => {
  if (!rootElement) return;
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

// Start initialization
console.log("App booting...");

initStorage()
  .then(() => {
    console.log("Storage hydrated, rendering...");
    render();
  })
  .catch((err) => {
    console.error("Storage hydration failed, attempting render anyway", err);
    render();
  })
  .finally(() => {
    // Only register PWA service worker on real web.
    if (!isNative) {
      import("virtual:pwa-register")
        .then(({ registerSW }) => registerSW({ immediate: true }))
        .catch(() => {});
    }
  });
