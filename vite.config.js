import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  server: {
    // /api/recap is served by server/index.js (run separately via `npm run server`
    // in dev) — this forwards it so the app can call the same relative path in dev and prod.
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Registered manually in main.jsx, gated to web only — a service worker inside the
      // Capacitor WebView would fight the native app's own asset loading/caching.
      injectRegister: false,
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "FitLog — Workout Tracker",
        short_name: "FitLog",
        description: "Full-featured workout tracker with templates, goals, calculators and body tracking.",
        theme_color: "#F5EFE8",
        background_color: "#F5EFE8",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        skipWaiting: true,
        clientsClaim: true,
      }
    })
  ]
});
