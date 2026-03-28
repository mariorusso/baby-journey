import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load your Cloudflare credentials
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./app/db/schema.ts", // or "./app/db/schema.ts" depending on your project structure
  out: "./drizzle",
  dialect: "sqlite", // D1 is SQLite-based
  driver: "d1-http", // This tells Drizzle to push via Cloudflare's HTTP API
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
  verbose: true,
  strict: true,
});