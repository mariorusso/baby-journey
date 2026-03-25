/**
 * Allowed MIME types for media uploads.
 * Used for both server-side validation and presigned URL ContentType scoping.
 */
export const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

/**
 * Maps MIME types to file extensions for R2 key generation.
 */
export const MIME_TO_EXTENSION: Record<AllowedMediaType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

/** Maximum file size: 50 MB */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** Presigned URL TTL in seconds */
export const PRESIGN_EXPIRES_IN = 300; // 5 minutes
