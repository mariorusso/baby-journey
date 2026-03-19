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

export async function uploadMoment(formData: FormData) {
  const file = formData.get("file") as File;
  const caption = formData.get("caption") as string;
  
  if (!file || file.size === 0) throw new Error("No file uploaded");

  // 1. Create a unique filename
  const uniqueFilename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    // 2. Upload to Cloudflare R2
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: uniqueFilename,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // 3. Save the moment to your PostgreSQL Database!
    await db.insert(moments).values({
      r2Key: uniqueFilename,
      caption: caption || "",
      milestoneDate: new Date(), 
    });
  } catch (error) {
    console.error("Upload Error:", error);
    throw new Error("Failed to upload moment.");
  }

  // 4. Revalidate and redirect
  revalidatePath("/");
  redirect("/");
}