"use client";

import { useState, useRef, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────

export interface UploaderDictionary {
  idle: string;
  idleHint: string;
  dragActive: string;
  uploading: string;
  success: string;
  error: string;
  retry: string;
  fileTooLarge: string;
  invalidType: string;
}

interface MediaUploaderProps {
  babyId: string;
  dict: UploaderDictionary;
  onUploadComplete?: (moment: Record<string, unknown>) => void;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

// ── Component ─────────────────────────────────────────────────────────

export function MediaUploader({
  babyId,
  dict,
  onUploadComplete,
}: MediaUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Validation ──────────────────────────────────────────────────────

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return dict.invalidType;
    }
    if (file.size > MAX_FILE_SIZE) {
      return dict.fileTooLarge;
    }
    return null;
  }

  // ── Upload Flow ─────────────────────────────────────────────────────

  const handleUpload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setStatus("error");
        setErrorMessage(validationError);
        return;
      }

      setStatus("uploading");
      setProgress(0);
      setErrorMessage("");

      try {
        // Step 1: Get presigned URL
        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            babyId,
            contentType: file.type,
            fileSizeBytes: file.size,
          }),
        });

        if (!presignRes.ok) {
          const err = await presignRes.json();
          throw new Error(err.error || "Failed to get upload URL");
        }

        const { presignedUrl, r2Key } = await presignRes.json();

        // Step 2: Upload directly to R2 with progress tracking
        await uploadToR2(presignedUrl, file);

        // Step 3: Confirm the upload
        const confirmRes = await fetch("/api/upload/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            babyId,
            r2Key,
            mediaType: file.type,
            fileSizeBytes: file.size,
          }),
        });

        if (!confirmRes.ok) {
          const err = await confirmRes.json();
          throw new Error(err.error || "Failed to save record");
        }

        const { moment } = await confirmRes.json();
        setProgress(100);
        setStatus("success");
        onUploadComplete?.(moment);

        // Reset after 3 seconds
        setTimeout(() => {
          setStatus("idle");
          setProgress(0);
        }, 3000);
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : dict.error
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [babyId, dict, onUploadComplete]
  );

  // ── R2 PUT with XMLHttpRequest progress ─────────────────────────────

  function uploadToR2(presignedUrl: string, file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          // Map to 10–90% range (0-10% = presign, 90-100% = confirm)
          const pct = Math.round(10 + (e.loaded / e.total) * 80);
          setProgress(pct);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(90);
          resolve();
        } else {
          reject(new Error(`R2 upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  }

  // ── Drag & Drop Handlers ────────────────────────────────────────────

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (status !== "uploading") setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (status === "uploading") return;

    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  function handleClick() {
    if (status === "uploading") return;
    fileInputRef.current?.click();
  }

  function handleRetry() {
    setStatus("idle");
    setProgress(0);
    setErrorMessage("");
  }

  // ── Render ──────────────────────────────────────────────────────────

  const dropzoneClass = [
    "uploader-dropzone",
    isDragOver && "uploader-drag-over",
    status === "uploading" && "uploader-busy",
    status === "success" && "uploader-success",
    status === "error" && "uploader-error",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={dropzoneClass}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4,video/quicktime,video/webm"
        onChange={handleFileSelect}
        className="uploader-input"
        aria-hidden
      />

      {/* ── Idle State ── */}
      {status === "idle" && (
        <div className="uploader-content">
          <div className="uploader-icon">
            {isDragOver ? "📥" : "📸"}
          </div>
          <p className="uploader-title">
            {isDragOver ? dict.dragActive : dict.idle}
          </p>
          <p className="uploader-hint">{dict.idleHint}</p>
        </div>
      )}

      {/* ── Uploading State ── */}
      {status === "uploading" && (
        <div className="uploader-content">
          <div className="uploader-icon">☁️</div>
          <p className="uploader-title">{dict.uploading}</p>
          <div className="uploader-progress-track">
            <div
              className="uploader-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="uploader-hint">{progress}%</p>
        </div>
      )}

      {/* ── Success State ── */}
      {status === "success" && (
        <div className="uploader-content">
          <div className="uploader-icon">✅</div>
          <p className="uploader-title">{dict.success}</p>
        </div>
      )}

      {/* ── Error State ── */}
      {status === "error" && (
        <div className="uploader-content">
          <div className="uploader-icon">❌</div>
          <p className="uploader-title">{errorMessage || dict.error}</p>
          <button
            type="button"
            className="uploader-retry"
            onClick={(e) => {
              e.stopPropagation();
              handleRetry();
            }}
          >
            {dict.retry}
          </button>
        </div>
      )}
    </div>
  );
}
