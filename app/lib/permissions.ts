import { getDb } from "@/app/db";
import { babies, accessShares } from "@/app/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Checks if the given Clerk user has upload permission for the given baby.
 */
export async function assertCanUpload(
  userId: string,
  babyId: string
): Promise<boolean> {
  const db = getDb();

  // Check 1: Is the user the baby's owner?
  const baby = await db.query.babies.findFirst({
    where: and(eq(babies.id, babyId), eq(babies.ownerId, userId)),
    columns: { id: true },
  });

  if (baby) return true;

  // Check 2: Does the user have an 'editor' access share?
  const share = await db.query.accessShares.findFirst({
    where: and(
      eq(accessShares.babyId, babyId),
      eq(accessShares.userId, userId),
      eq(accessShares.role, "editor")
    ),
    columns: { id: true },
  });

  if (share) return true;

  return false;
}

/**
 * Fetches baby details IF the user has ANY access (owner, editor, or viewer).
 */
export async function getBabyWithAccess(
  userId: string,
  babyId: string
): Promise<{ 
  baby: typeof babies.$inferSelect; 
  role: "owner" | "editor" | "viewer" 
} | null> {
  const db = getDb();

  // 1. Is the user the owner?
  const ownedBaby = await db.query.babies.findFirst({
    where: and(eq(babies.id, babyId), eq(babies.ownerId, userId)),
  });

  if (ownedBaby) {
    return { baby: ownedBaby, role: "owner" };
  }

  // 2. Is there a shared access?
  const shared = await db.query.accessShares.findFirst({
    where: and(eq(accessShares.id, babyId), eq(accessShares.userId, userId)),
    with: { baby: true },
  });

  if (shared && shared.baby) {
    return { baby: shared.baby, role: shared.role as "editor" | "viewer" };
  }

  return null;
}
