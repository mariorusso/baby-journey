import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── 1. USERS ──────────────────────────────────────────────────────────
// Auth.js required fields + custom Baby Journey fields
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  // Custom Baby Journey fields
  stripeCustomerId: text("stripe_customer_id"),
  plan: text("plan").default("free").notNull(), // 'free', 'pro', 'lifetime'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── 2. ACCOUNTS (Auth.js – OAuth provider links) ─────────────────────
export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
);

// ── 3. SESSIONS (Auth.js – database session strategy) ────────────────
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expires: timestamp("expires").notNull(),
});

// ── 4. VERIFICATION TOKENS (Auth.js – magic link flow) ──────────────
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// ── 5. BABIES: The "Tenant" entity ──────────────────────────────────
export const babies = pgTable("babies", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: text("owner_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  birthday: timestamp("birthday").notNull(),
  profileImageKey: text("profile_image_key"), // R2 key for avatar
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── 6. MOMENTS: Timeline entries (Photos/Videos) ────────────────────
export const moments = pgTable("moments", {
  id: serial("id").primaryKey(),
  babyId: uuid("baby_id")
    .references(() => babies.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  r2Key: text("r2_key").notNull(),
  mediaType: text("media_type").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  caption: text("caption"),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  capturedAt: timestamp("captured_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── 7. ACCESS SHARES: The "Grandma Hook" ────────────────────────────
export const accessShares = pgTable("access_shares", {
  id: uuid("id").defaultRandom().primaryKey(),
  babyId: uuid("baby_id")
    .references(() => babies.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id").references(() => users.id),
  invitedEmail: text("invited_email").notNull(),
  role: text("role").default("viewer").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── RELATIONS ─────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  babies: many(babies),
  moments: many(moments),
  accessShares: many(accessShares),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
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