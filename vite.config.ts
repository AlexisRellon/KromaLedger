import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const proc = (globalThis as any).process;
  if (proc?.cwd && proc?.env) {
    const env = loadEnv(mode, proc.cwd(), "");
    Object.assign(proc.env, env);
  }

  return {
    plugins: [
      {
        name: "netlify-functions-dev-proxy",
        configureServer(server) {
          server.middlewares.use(async (req: any, res: any, next: any) => {
            if (req.url && req.url.startsWith("/.netlify/functions/gemma")) {
              try {
                const { default: handler } = await import("./netlify/functions/gemma.ts");
                const fullUrl = `http://${req.headers.host || "localhost"}${req.url}`;
                const chunks: any[] = [];
                for await (const chunk of req) {
                  chunks.push(chunk);
                }
                const hasBody = req.method !== "GET" && req.method !== "HEAD" && chunks.length > 0;
                const rawBody = hasBody ? (globalThis as any).Buffer.concat(chunks) : undefined;
                const webReq = new Request(fullUrl, {
                  method: req.method,
                  headers: req.headers,
                  body: rawBody,
                  duplex: rawBody ? "half" : undefined,
                } as any);

                const webRes = await handler(webReq);
                res.statusCode = webRes.status;
                webRes.headers.forEach((value: string, key: string) => {
                  res.setHeader(key, value);
                });
                const responseText = await webRes.text();
                res.end(responseText);
                return;
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err?.message || String(err) }));
                return;
              }
            }
            next();
          });
        },
      },
      react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "favicon.svg",
        "apple-touch-icon.png",
        "pwa-icon.svg",
        "kaban-horizontal-color.svg",
        "kaban-horizontal-ivory.svg",
        "fonts/*.woff2",
      ],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2,png,ico}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/fonts/"),
            handler: "CacheFirst",
            options: {
              cacheName: "kaban-fonts",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === "img.logo.dev",
            handler: "CacheFirst",
            options: {
              cacheName: "kaban-logodev-brandmarks",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
      manifest: {
        name: "Kaban",
        short_name: "Kaban",
        description: "A private, local-first personal financial vault.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#FAF8F5",
        theme_color: "#FAF8F5",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/kaban-app-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@tanstack/react-query/")) {
            return "vendor-query";
          }
          if (id.includes("node_modules/dexie/")) {
            return "vendor-db";
          }
          if (id.includes("node_modules/date-fns/") || id.includes("node_modules/zod/")) {
            return "vendor-utils";
          }
        },
      },
    },
  },
    test: { environment: "node" },
  };
});

