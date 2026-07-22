import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (/[\\/]node_modules[\\/](react|react-dom)[\\/]/.test(id)) {
            return "react-vendor";
          }

          if (
            /[\\/]node_modules[\\/](@tanstack|react-router-dom)[\\/]/.test(id)
          ) {
            return "routing-vendor";
          }

          if (/[\\/]node_modules[\\/](primereact|primeicons)[\\/]/.test(id)) {
            return "prime-vendor";
          }

          if (
            /[\\/]node_modules[\\/](@radix-ui|lucide-react|react-icons|framer-motion|cmdk|vaul|next-themes)[\\/]/.test(
              id,
            )
          ) {
            return "ui-vendor";
          }

          if (
            /[\\/]node_modules[\\/](axios|zod|react-hook-form|@hookform|sweetalert2|sonner|crypto-js|jwt-decode|xlsx|file-saver|recharts)[\\/]/.test(
              id,
            )
          ) {
            return "data-vendor";
          }

          return "vendor";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
