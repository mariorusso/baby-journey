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
        // Step 1: Upload directly to the binding through /api/upload/direct
        const formData = new FormData();
        formData.append("file", file);
        formData.append("babyId", babyId);

        const uploadRes = await uploadDirectly(formData);
        const { r2Key } = uploadRes;

        // Step 2: Confirm metadata insertion
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
          const errData = (await confirmRes.json()) as { error?: string };
          throw new Error(errData.error || "Failed to save record");
        }

        const { moment } = (await confirmRes.json()) as { moment: Record<string, unknown> };
        setProgress(100);
        setStatus("success");
        onUploadComplete?.(moment);

        // Reset after 3 seconds
        setTimeout(() => {
          setStatus("idle");
          setProgress(0);
        }, 3000);
      } catch (err: unknown) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : dict.error
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [babyId, dict, onUploadComplete]
  );

  /**
   * Performs the actual upload to /api/upload/direct with progress tracking.
   */
  function uploadDirectly(formData: FormData): Promise<{ r2Key: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          // Map to 0–90% range for the actual upload
          const pct = Math.round((e.loaded / e.total) * 90);
          setProgress(pct);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            setProgress(90);
            resolve(data);
          } catch {
            reject(new Error("Failed to parse server response"));
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            reject(new Error(data.error || "Upload failed"));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.open("POST", "/api/upload/direct");
      xhr.send(formData);
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

  const dropzoneClass = `uploader-dropzone ${isDragOver ? "uploader-drag-over" : ""} ${status === "uploading" ? "uploader-busy" : ""} ${status === "success" ? "uploader-success" : ""} ${status === "error" ? "uploader-error" : ""}`;

  return (
    <div
      className="p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[240px]"
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
        className="hidden"
        aria-hidden
      />

      {/* ── Idle State ── */}
      {status === "idle" && (
        <div className="flex flex-col items-center text-center">
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
            {isDragOver ? "📥" : "📸"}
          </div>
          <p className="text-lg font-bold text-slate-700">
            {isDragOver ? dict.dragActive : dict.idle}
          </p>
          <p className="text-sm text-slate-400 mt-1">{dict.idleHint}</p>
        </div>
      )}

      {/* ── Uploading State ── */}
      {status === "uploading" && (
        <div className="flex flex-col items-center w-full max-w-xs">
          <div className="text-4xl mb-4 animate-bounce">☁️</div>
          <p className="text-sm font-bold text-slate-700 mb-3">{dict.uploading}</p>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner mb-2">
            <div
              className="bg-indigo-600 h-full transition-all duration-300 shadow-[0_0_12px_rgba(79,70,229,0.4)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs font-bold text-indigo-600">{progress}%</p>
        </div>
      )}

      {/* ── Success State ── */}
      {status === "success" && (
        <div className="flex flex-col items-center text-center">
          <div className="text-4xl mb-3 animate-pulse">✅</div>
          <p className="text-lg font-bold text-green-600">{dict.success}</p>
        </div>
      )}

      {/* ── Error State ── */}
      {status === "error" && (
        <div className="flex flex-col items-center text-center">
          <div className="text-4xl mb-3">❌</div>
          <p className="text-sm font-bold text-red-500 max-w-xs">{errorMessage || dict.error}</p>
          <button
            type="button"
            className="mt-4 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors"
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
