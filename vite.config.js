import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "Alarmas ITX",
        short_name: "ITX",
        description: "Monitoreo de temperatura en tiempo real",
        theme_color: "#0f172a", // Color app (slate-950)
        background_color: "#0f172a",
        display: "standalone",
        icons: [
          {
            src: "web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable", 
          },
        ],
      },
      workbox: {
        // Firebase (NetworkFirst: intenta red, si no, usa caché)
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin.includes("firebaseapp.com") ||
              url.origin.includes("googleapis.com"),
            handler: "NetworkFirst",
            options: {
              cacheName: "firebase-data",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 día
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
  },
});
