import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/Uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      "@mui/material": "@mui/material",
      "@mui/icons-material": "@mui/icons-material",
    },
  },
  assetsInclude: ["**/*.woff2", "**/*.woff", "**/*.ttf", "**/*.otf"],
});
