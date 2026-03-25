import { auth } from "@/auth";
import { NextRequest } from "next/server";
import { z } from "zod";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/app/lib/r2";
import { db } from "@/app/db";
import { moments } from "@/app/db/schema";
import { assertCanUpload } from "@/app/lib/permissions";
import { ALLOWED_MEDIA_TYPES, MAX_FILE_SIZE_BYTES } from "@/app/lib/constants";

// ── Request validation schema ────────────────────────────────────────
const confirmSchema = z.object({
  babyId: z.string().uuid("babyId must be a valid UUID"),
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
    // 1. Authenticate via NextAuth
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

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

    // 5. Integrity check: verify the object actually exists in R2
    try {
      await r2.send(
        new HeadObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: r2Key,
        })
      );
    } catch {
      return Response.json(
        { error: "File not found in storage. Did the upload complete successfully?" },
        { status: 400 }
      );
    }

    // 6. Insert the moment into the database
    const [moment] = await db
      .insert(moments)
      .values({
        babyId,
        userId,
        r2Key,
        mediaType,
        fileSizeBytes,
        caption: caption ?? null,
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
