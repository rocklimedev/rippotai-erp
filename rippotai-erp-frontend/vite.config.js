import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { contentSecurityPolicy } from './security/csp.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    contentSecurityPolicy(),
    react(),

    VitePWA({
      registerType: "autoUpdate",

      injectRegister: "script",

      includeAssets: [
        "rippotai-favicon-nobg.png",
        "favicon.svg",
        "rippotai_logo.png",
        "apple-touch-icon.png",
      ],

      manifest: {
        id: "/",

        name: "Rippotai ERP",

        short_name: "Rippotai",

        description:
          "Rippotai ERP — Project, Procurement, Site Operations and Business Management",

        start_url: "/",

        scope: "/",

        display: "standalone",

        orientation: "portrait",

        theme_color: "#103E31",

        background_color: "#ffffff",

        categories: ["business", "productivity"],

        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,

        navigateFallback: "/index.html",

        // Your current main bundle is ~4.2 MB.
        // Workbox defaults to 2 MB.
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,

            handler: "CacheFirst",

            options: {
              cacheName: "google-fonts",

              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],

  // Local server: same-origin API proxy so a shared tunnel link works
  // (start with VITE_BACKEND_URL=/ ; plain localhost:5050 still works too).
  server: {
    allowedHosts: true,
    proxy: {
      "/api": { target: "http://localhost:5050", changeOrigin: false },
      "/cdn": { target: "http://localhost:5050", changeOrigin: false },
      "/socket.io": { target: "http://localhost:5050", ws: true },
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development",
    ),

    "process.env": {},
  },

  build: {
    chunkSizeWarningLimit: 5000,
  },
});
