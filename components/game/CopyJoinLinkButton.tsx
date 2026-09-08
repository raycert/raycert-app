"use client";

import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Copies `url` to the clipboard and shows "Đã sao chép liên kết". URL is
 * always passed in via props — never constructed or hard-coded here.
 */
export function CopyJoinLinkButton({ url, className }: { url: string; className?: string }) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Đã sao chép liên kết");
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleCopy}
      className={`border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white ${className ?? ""}`}
    >
      <CopyIcon />
      Copy Join Link
    </Button>
  );
}
