import { getCloudflareContext } from "@opennextjs/cloudflare";

export const getBucket = async () => {
  const context = await getCloudflareContext();
  
  if (!context) {
    throw new Error("Cloudflare Request Context not found. R2 Access requires the Edge runtime.");
  }

  return context.env.BUCKET;
};