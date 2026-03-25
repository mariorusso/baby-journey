"use client";

import { useRouter } from "next/navigation";
import { MediaUploader, UploaderDictionary } from "@/app/components/media-uploader";

interface UploaderWrapperProps {
  babyId: string;
  dict: UploaderDictionary;
}

export function UploaderWrapper({ babyId, dict }: UploaderWrapperProps) {
  const router = useRouter();

  return (
    <MediaUploader
      babyId={babyId}
      dict={dict}
      onUploadComplete={() => {
        // Refresh the server component to show the new moment
        router.refresh();
      }}
    />
  );
}
