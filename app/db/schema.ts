import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ── 1. USERS (Clerk Mirror) ──────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // This will be the Clerk userId
  name: text("name"),
  email: text("email").unique().notNull(),
  image: text("image"),
  stripeCustomerId: text("stripe_customer_id"),
  plan: text("plan").default("free").notNull(), // 'free', 'pro', 'lifetime'
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ── 2. BABIES (The Tenant) ──────────────────────────────────────────
export const babies = sqliteTable("babies", {
  id: text("id").primaryKey(), // NanoID
  ownerId: text("owner_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  birthday: integer("birthday", { mode: "timestamp" }).notNull(),
  profileImageKey: text("profile_image_key"), // R2 key for avatar
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ── 3. MOMENTS (Timeline Items) ─────────────────────────────────────
export const moments = sqliteTable("moments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  babyId: text("baby_id")
    .references(() => babies.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  r2Key: text("r2_key").notNull(),
  mediaType: text("media_type").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  caption: text("caption"),
  isFavorite: integer("is_favorite", { mode: "boolean" }).default(false).notNull(),
  capturedAt: integer("captured_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ── 4. ACCESS SHARES (The Grandma Hook) ─────────────────────────────
export const accessShares = sqliteTable("access_shares", {
  id: text("id").primaryKey(), // NanoID
  babyId: text("baby_id")
    .references(() => babies.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id").references(() => users.id),
  invitedEmail: text("invited_email").notNull(),
  role: text("role").default("viewer").notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ── RELATIONS ─────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  babies: many(babies),
  moments: many(moments),
  accessShares: many(accessShares),
}));

export const babiesRelations = relations(babies, ({ one, many }) => ({
  owner: one(users, { fields: [babies.ownerId], references: [users.id] }),
  moments: many(moments),
  accessShares: many(accessShares),
}));

export const momentsRelations = relations(moments, ({ one }) => ({
  baby: one(babies, { fields: [moments.babyId], references: [babies.id] }),
  user: one(users, { fields: [moments.userId], references: [users.id] }),
}));

export const accessSharesRelations = relations(accessShares, ({ one }) => ({
  baby: one(babies, {
    fields: [accessShares.babyId],
    references: [babies.id],
  }),
  user: one(users, {
    fields: [accessShares.userId],
    references: [users.id],
  }),
}));