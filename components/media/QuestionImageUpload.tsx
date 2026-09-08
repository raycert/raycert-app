"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

type Phase = "idle" | "drag-over" | "uploading" | "error";

export function QuestionImageUpload({
  imageUrl,
  onUploaded,
  onRemove,
}: {
  imageUrl?: string;
  onUploaded: (url: string, fileName: string) => void;
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
      onUploaded(url, file.name);
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
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {phase === "uploading" ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border px-4.5 py-4.5 text-center">
          <p className="text-[12.5px] font-semibold">Đang tải ảnh lên…</p>
          <Progress value={progress} className="max-w-64" />
        </div>
      ) : imageUrl ? (
        <div className="flex items-center gap-2.5 rounded-lg border-[1.5px] border-teal-500 bg-teal-100 px-3.5 py-3.5 text-[12.5px] text-[#1c6e6e]">
          {/* eslint-disable-next-line @next/next/no-img-element -- local object/mock URL, not an optimizable remote asset */}
          <img src={imageUrl} alt="" className="size-10 shrink-0 rounded object-cover" />
          <span>Ảnh minh hoạ đã tải —</span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-semibold underline"
          >
            Replace
          </button>
          <span>·</span>
          <button type="button" onClick={handleRemove} className="font-semibold underline">
            Remove
          </button>
        </div>
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
            "flex items-center gap-2.5 rounded-lg border-[1.5px] border-dashed px-4.5 py-4.5 text-left text-[12.5px] text-muted-foreground transition-colors",
            phase === "drag-over"
              ? "border-primary bg-secondary"
              : phase === "error"
                ? "border-error-600"
                : "border-border"
          )}
        >
          <ImageIcon className="size-4.5 shrink-0" />
          <span>
            Image (optional, tối đa 1) — kéo thả hoặc{" "}
            <span className="font-semibold text-primary">Browse</span>
          </span>
        </button>
      )}

      {phase === "error" && errorMessage ? (
        <p role="alert" className="text-[12.5px] text-error-600">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
