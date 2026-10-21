import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({ registerType: "autoUpdate", includeAssets: ["pwa-icon.svg", "fonts/*.woff2", "fonts/*.txt"], manifest: { name: "KromaLedger", short_name: "KromaLedger", description: "A private, offline-first personal ledger.", start_url: "/", scope: "/", display: "standalone", background_color: "#070806", theme_color: "#070806", icons: [{ src: "/pwa-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }] } })],
  test: { environment: "node" },
});
