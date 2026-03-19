import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const moments = pgTable("moments", {
  id: serial("id").primaryKey(),
  caption: text("caption"),
  r2Key: text("r2_key").notNull(), // This holds the Cloudflare image filename
  milestoneDate: timestamp("milestone_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});