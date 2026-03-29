import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getBucket } from "@/app/lib/r2";
import { assertCanUpload } from "@/app/lib/permissions";
import { nanoid } from "nanoid";
import { MIME_TO_EXTENSION, AllowedMediaType } from "@/app/lib/constants";

export const runtime = "edge";

/**
 * Direct upload to R2 via Cloudflare bindings.
 * This replaces the legacy presigned URL flow to keep the stack "Zero-Tax" and Cloudflare-Native.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse FormData
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const babyId = formData.get("babyId") as string;

    if (!file || !babyId) {
      return Response.json({ error: "Missing file or babyId" }, { status: 400 });
    }

    // 3. Permission check
    const authorized = await assertCanUpload(userId, babyId);
    if (!authorized) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Generate Key & Upload to R2
    const bucket = await getBucket();
    const extension = MIME_TO_EXTENSION[file.type as AllowedMediaType] || "bin";
    const r2Key = `${babyId}/${nanoid()}.${extension}`;

    // Upload the file directly to R2
    // We use arrayBuffer() instead of stream() to circumvent a TypeScript mismatch 
    // between DOM streams and Cloudflare Workers streams in the Next.js environment.
    await bucket.put(r2Key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });

    return Response.json({ r2Key });
  } catch (error) {
    console.error("[upload/direct] Error:", error);
    return Response.json({ error: "Internal server error during upload" }, { status: 500 });
  }
}
