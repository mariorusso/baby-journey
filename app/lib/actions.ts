"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/app/lib/r2";
import { db } from "@/app/db/index"; 
import { moments } from "@/app/db/schema";


// Add prevState here
export async function handleUpload(prevState: any, formData: FormData) {
  const file = formData.get("file") as File;
  if (!file || file.size === 0) return { error: "No file provided" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}-${file.name}`;

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      })
    );

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