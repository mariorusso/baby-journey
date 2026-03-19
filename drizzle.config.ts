import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Force Drizzle to read your .env.local file
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./app/db/schema.ts", // <-- Update this path if your schema is elsewhere
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});