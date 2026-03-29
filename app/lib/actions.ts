"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getBucket } from "@/app/lib/r2";
import { getDb } from "@/app/db/index";


// Add prevState here
export async function handleUpload(prevState: any, formData: FormData) {
  const file = formData.get("file") as File;
  if (!file || file.size === 0) return { error: "No file provided" };

  const arrayBuffer = await file.arrayBuffer();
  const fileName = `${Date.now()}-${file.name}`;

  try {
    const bucket = await getBucket();
    await bucket.put(fileName, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    });

    return { success: true, key: fileName, error: null };
  } catch (error) {
    console.error("R2 Upload Error:", error);
    return { error: "Failed to save file to storage.", success: false };
  }
}

// NOTE: The uploadMoment server action has been removed.
// Uploads are now handled via the two-phase presigned URL flow:
//   1. POST /api/upload/presign  → get a presigned PUT URL
//   2. Client uploads directly to R2
//   3. POST /api/upload/confirm  → verify & insert into DB
