import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from '@opennextjs/cloudflare';
import * as schema from "./schema";

export const getDb = async () => {
  const context = await getCloudflareContext();
  
  // If context is undefined (during local build/SSR), use a fallback or throw
  if (!context) {
    throw new Error("Cloudflare Request Context not found. Ensure you are running in the Pages environment.");
  }

  // context.env.DB is the binding name assigned in wrangler.jsonc
  return drizzle(context.env.DB, { schema });
};