import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/LCC_date_schedule/",
  plugins: [react()],
  server: {
    port: 5173,
  },
});
