"use server";

import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/app/db";
import { users } from "@/app/db/schema";

/**
 * Mirror the Clerk user into the D1 users table.
 * Triggered on first land on protected routes (like the Dashboard).
 */
export async function syncUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  const db = getDb();

  // 1. Check if the user already exists in D1
  const existingUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, clerkUser.id),
  });

  if (existingUser) {
    return existingUser;
  }

  // 2. Insert if not found
  const primaryEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    throw new Error("Clerk user has no email address");
  }

  const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ");

  const [newUser] = await db.insert(users).values({
    id: clerkUser.id,
    name: fullName || null,
    email: primaryEmail,
    image: clerkUser.imageUrl,
    createdAt: new Date(),
  }).returning();

  return newUser;
}
