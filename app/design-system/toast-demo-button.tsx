"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ToastDemoButton() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => toast("Đã lưu thay đổi.")}>
        Info toast
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.success("Đã lưu thay đổi.")}
      >
        Success toast
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.error("Không thể lưu thay đổi.")}
      >
        Error toast
      </Button>
    </div>
  );
}
