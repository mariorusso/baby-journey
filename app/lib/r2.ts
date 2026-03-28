import { getRequestContext } from "@cloudflare/next-on-pages";

/**
 * Access the Cloudflare R2 bucket binding directy via the Request Context.
 * Requires "nodejs_compat" in wrangler.jsonc or .toml.
 */
export const getBucket = () => {
  const context = getRequestContext();
  
  if (!context) {
    throw new Error("Cloudflare Request Context not found. R2 Access requires the Edge runtime.");
  }

  // "BUCKET" is the binding name in wrangler.jsonc
  return context.env.BUCKET;
};