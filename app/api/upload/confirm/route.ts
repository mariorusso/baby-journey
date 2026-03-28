import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import { getBucket } from "@/app/lib/r2";
import { getDb } from "@/app/db";
import { moments } from "@/app/db/schema";
import { assertCanUpload } from "@/app/lib/permissions";
import { ALLOWED_MEDIA_TYPES, MAX_FILE_SIZE_BYTES } from "@/app/lib/constants";

export const runtime = "edge"; // Full Cloudflare Native

// ── Request validation schema ────────────────────────────────────────
const confirmSchema = z.object({
  babyId: z.string().min(1, "babyId is required"), // Switched from UUID to NanoID
  r2Key: z.string().min(1, "r2Key is required"),
  mediaType: z.enum(ALLOWED_MEDIA_TYPES, {
    message: `mediaType must be one of: ${ALLOWED_MEDIA_TYPES.join(", ")}`,
  }),
  fileSizeBytes: z
    .number()
    .int()
    .positive("fileSizeBytes must be a positive integer")
    .max(MAX_FILE_SIZE_BYTES, `File size must not exceed ${MAX_FILE_SIZE_BYTES} bytes`),
  caption: z.string().max(500, "Caption must not exceed 500 characters").optional(),
});

// ── POST /api/upload/confirm ─────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate via Clerk
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse & validate request body
    const body = await request.json();
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { babyId, r2Key, mediaType, fileSizeBytes, caption } = parsed.data;

    // 3. Authorize: user must own the baby or have 'editor' access
    const authorized = await assertCanUpload(userId, babyId);
    if (!authorized) {
      return Response.json(
        { error: "Forbidden: you do not have upload permission for this baby" },
        { status: 403 }
      );
    }

    // 4. Security: verify the r2Key belongs to the correct babyId folder
    if (!r2Key.startsWith(`${babyId}/`)) {
      return Response.json(
        { error: "r2Key does not match the provided babyId" },
        { status: 400 }
      );
    }

    // 5. Integrity check: verify the object exists in R2 using the binding
    const bucket = getBucket();
    const head = await bucket.head(r2Key);
    
    if (!head) {
      return Response.json(
        { error: "File not found in storage. Did the upload complete successfully?" },
        { status: 400 }
      );
    }

    // 6. Insert the moment into the database (D1)
    const db = getDb();
    const [moment] = await db
      .insert(moments)
      .values({
        babyId,
        userId,
        r2Key,
        mediaType,
        fileSizeBytes,
        caption: caption ?? null,
        createdAt: new Date(),
        capturedAt: new Date(),
      })
      .returning();

    return Response.json({ success: true, moment }, { status: 201 });
  } catch (error) {
    console.error("[confirm] Unexpected error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
