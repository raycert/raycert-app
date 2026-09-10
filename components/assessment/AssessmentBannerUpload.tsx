"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AssessmentBanner } from "./AssessmentBanner";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

type Phase = "idle" | "drag-over" | "uploading" | "error";

/**
 * Banner upload widget (Phase 9C banner addendum §1/§2/§4/§11) — same file
 * rules as `QuestionImageUpload` (JPG/JPEG/PNG/WebP, 5MB, 1 image) but a
 * standalone component, not a refactor of that shared question-image
 * component, so Live Quiz's question image upload is never touched by this
 * addition. When an image is set, renders the exact image-only
 * `AssessmentBanner` used on the Start Screen as a WYSIWYG preview instead
 * of a plain thumbnail — no title/subtitle overlay (Start Screen UI fix-up
 * §8). A rejected file never replaces the existing banner — validation
 * happens before `onUploaded` is ever called.
 */
export function AssessmentBannerUpload({
  bannerImageUrl,
  bannerFileName,
  onUploaded,
  onRemove,
}: {
  bannerImageUrl?: string;
  bannerFileName?: string;
  onUploaded: (url: string, fileName: string, mimeType: string) => void;
  onRemove: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function handleFile(file: File | undefined) {
    setPhase("idle");
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrorMessage("Chỉ chấp nhận JPG, JPEG, PNG hoặc WebP");
      setPhase("error");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage("Dung lượng ảnh tối đa 5MB");
      setPhase("error");
      return;
    }

    setPhase("uploading");
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 25, 90));
    }, 120);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      onUploaded(url, file.name, file.type);
      setPhase("idle");
    }, 650);
  }

  function handleRemove() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = undefined;
    }
    setErrorMessage(undefined);
    setPhase("idle");
    onRemove();
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {phase === "uploading" ? (
        <div className="flex aspect-16/5 w-full flex-col items-center justify-center gap-2 rounded-lg border border-border text-center">
          <p className="text-[12.5px] font-semibold">Đang tải banner lên…</p>
          <Progress value={progress} className="max-w-64" />
        </div>
      ) : bannerImageUrl ? (
        <AssessmentBanner imageUrl={bannerImageUrl} imageAlt={bannerFileName} />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setPhase("drag-over");
          }}
          onDragLeave={() => setPhase((p) => (p === "drag-over" ? "idle" : p))}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex aspect-16/5 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed px-4.5 text-center text-[12.5px] text-muted-foreground transition-colors",
            phase === "drag-over"
              ? "border-primary bg-secondary"
              : phase === "error"
                ? "border-error-600"
                : "border-border"
          )}
        >
          <ImageIcon className="size-5" />
          <span>
            Upload banner — kéo thả hoặc <span className="font-semibold text-primary">Browse</span>
          </span>
          <span className="text-[11px]">Supported: JPG, PNG, WebP · max 5 MB</span>
          <span className="text-[11px]">Khuyến nghị ảnh ngang, tỷ lệ khoảng 16:5.</span>
        </button>
      )}

      {bannerImageUrl && phase !== "uploading" ? (
        <div className="flex items-center gap-3 text-[12.5px]">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-semibold text-primary underline"
          >
            Replace
          </button>
          <span className="text-muted-foreground">·</span>
          <button type="button" onClick={handleRemove} className="font-semibold text-error-600 underline">
            Remove
          </button>
        </div>
      ) : null}

      {phase === "error" && errorMessage ? (
        <p role="alert" className="text-[12.5px] text-error-600">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
