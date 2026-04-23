import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/core/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
})
