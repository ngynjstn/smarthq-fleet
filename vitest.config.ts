import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Node environment (we test pure business logic, no DOM).
// The alias mirrors tsconfig's "@/*" -> "./src/*" so tests import the
// same way the app does.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
