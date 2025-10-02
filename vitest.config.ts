import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.{test,spec}.ts"], // picks up .test.ts and .spec.ts
    coverage: {
      reporter: ["text", "json", "html"], // optional coverage
    },
  },
});
