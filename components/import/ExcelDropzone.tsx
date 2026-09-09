"use client";

import { useRef, useState } from "react";
import { UploadCloudIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ExcelDropzone({
  onFileSelected,
  onDownloadTemplate,
  disabled,
}: {
  onFileSelected: (file: File) => void;
  onDownloadTemplate: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center gap-2.5 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors",
        dragOver ? "border-primary bg-secondary" : "border-border bg-secondary/40"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <UploadCloudIcon className="size-6 text-muted-foreground" />
      <p className="text-[12.5px] text-body">Kéo thả file .xlsx vào đây</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        Browse File
      </Button>
      <button
        type="button"
        onClick={onDownloadTemplate}
        className="text-[11.5px] font-semibold text-brand-500 underline"
      >
        Download Template
      </button>
    </div>
  );
}
