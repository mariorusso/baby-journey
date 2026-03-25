import { auth } from "@/auth";
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/app/lib/r2";
import { assertCanUpload } from "@/app/lib/permissions";
import {
  ALLOWED_MEDIA_TYPES,
  MIME_TO_EXTENSION,
  MAX_FILE_SIZE_BYTES,
  PRESIGN_EXPIRES_IN,
} from "@/app/lib/constants";

// ── Request validation schema ────────────────────────────────────────
const presignSchema = z.object({
  babyId: z.string().uuid("babyId must be a valid UUID"),
  contentType: z.enum(ALLOWED_MEDIA_TYPES, {
    message: `contentType must be one of: ${ALLOWED_MEDIA_TYPES.join(", ")}`,
  }),
  fileSizeBytes: z
    .number()
    .int()
    .positive("fileSizeBytes must be a positive integer")
    .max(MAX_FILE_SIZE_BYTES, `File size must not exceed ${MAX_FILE_SIZE_BYTES} bytes`),
});

// ── POST /api/upload/presign ─────────────────────────────────────────
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
    const parsed = presignSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { babyId, contentType, fileSizeBytes } = parsed.data;

    // 3. Authorize: user must own the baby or have 'editor' access
    const authorized = await assertCanUpload(userId, babyId);
    if (!authorized) {
      return Response.json(
        { error: "Forbidden: you do not have upload permission for this baby" },
        { status: 403 }
      );
    }

    // 4. Generate a randomized, non-guessable R2 key
    const extension = MIME_TO_EXTENSION[contentType];
    const r2Key = `${babyId}/${crypto.randomUUID()}.${extension}`;

    // 5. Create a presigned PUT URL
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: r2Key,
      ContentType: contentType,
    });
    const presignedUrl = await getSignedUrl(r2, command, {
      expiresIn: PRESIGN_EXPIRES_IN,
    });

    // 6. Return the URL and key to the client
    return Response.json({ presignedUrl, r2Key });
  } catch (error) {
    console.error("[presign] Unexpected error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
