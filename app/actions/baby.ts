"use server";

import { auth } from "@/auth";
import { db } from "@/app/db";
import { babies } from "@/app/db/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createBaby(formData: FormData) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // 2. Extract & validate
  const name = formData.get("name") as string;
  const birthdayStr = formData.get("birthday") as string;
  const lang = (formData.get("lang") as string) || "en";

  if (!name?.trim()) {
    throw new Error("Name is required");
  }
  if (!birthdayStr) {
    throw new Error("Birthday is required");
  }

  const birthday = new Date(birthdayStr);
  if (isNaN(birthday.getTime())) {
    throw new Error("Invalid date");
  }

  // 3. Insert into DB
  const [newBaby] = await db
    .insert(babies)
    .values({
      ownerId: session.user.id,
      name: name.trim(),
      birthday: birthday,
    })
    .returning();

  if (!newBaby) {
    throw new Error("Failed to create baby record");
  }

  // 4. Revalidate dashboard cache
  revalidatePath(`/${lang}/dashboard`);

  // 5. Redirect to the new album
  redirect(`/${lang}/album/${newBaby.id}`);
}
