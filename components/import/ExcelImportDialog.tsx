"use client";

import { toast } from "sonner";
import { UploadCloudIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Phase 3 scope: dialog shell only — no real .xlsx parser. Actions are
 * mock/inert and just confirm the interaction via a toast.
 */
export function ExcelImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Import Excel</DialogTitle>
          <DialogDescription>
            Import Excel sẽ được triển khai đầy đủ ở phase sau — đây là placeholder giao diện.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-2.5 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-6 py-8 text-center">
          <UploadCloudIcon className="size-6 text-muted-foreground" />
          <p className="text-[12.5px] text-body">Kéo thả file .xlsx vào đây</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toast("Import Excel sẽ được triển khai đầy đủ ở phase sau")}
          >
            Browse File
          </Button>
          <button
            type="button"
            onClick={() => toast("Import Excel sẽ được triển khai đầy đủ ở phase sau")}
            className="text-[11.5px] font-semibold text-brand-500 underline"
          >
            Download Template
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
