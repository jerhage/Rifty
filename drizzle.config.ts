import { defineConfig } from "drizzle-kit";

const config = defineConfig({
  dialect: "sqlite",
  driver: "expo",
  schema: "./src/infrastructure/database/schema.ts",
  out: "./drizzle",
});

export default config;
