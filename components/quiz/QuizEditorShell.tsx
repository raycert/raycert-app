"use client";

import { useState, type ReactNode } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { SaveStatus } from "@/hooks/use-quiz-editor";

const SAVE_STATUS_LABEL: Record<SaveStatus, string> = {
  saved: "Đã lưu",
  saving: "Đang lưu…",
  unsaved: "Chưa lưu",
  error: "Lỗi lưu",
};

export function QuizEditorShell({
  quizTitle,
  onTitleChange,
  saveStatus,
  saveError,
  onImportExcel,
  onPreview,
  onHost,
  hostDisabled,
  sidebar,
  children,
}: {
  quizTitle: string;
  onTitleChange: (title: string) => void;
  saveStatus: SaveStatus;
  saveError?: string | null;
  onImportExcel: () => void;
  onPreview: () => void;
  onHost: () => void;
  hostDisabled: boolean;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5.5">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mở danh sách câu hỏi"
            className="lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </Button>
          <label className="min-w-0">
            <span className="sr-only">Tên quiz</span>
            <input
              type="text"
              value={quizTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Untitled Quiz"
              className="w-full min-w-0 bg-transparent text-sm font-bold outline-none focus-visible:underline sm:text-[15px]"
            />
          </label>
          <span
            className={`shrink-0 text-xs font-medium ${saveStatus === "error" ? "text-destructive" : "text-muted-foreground"}`}
          >
            · {SAVE_STATUS_LABEL[saveStatus]}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={onImportExcel}>
            Import Excel
          </Button>
          <Button variant="secondary" size="sm" onClick={onPreview}>
            Preview
          </Button>
          <div className="flex flex-col items-end gap-0.5">
            <Button size="sm" onClick={onHost} disabled={hostDisabled}>
              Host
            </Button>
          </div>
        </div>
      </div>

      {saveStatus === "error" && saveError ? (
        <p className="border-b border-border bg-destructive/10 px-5.5 py-2 text-[12.5px] text-destructive">
          {saveError}
        </p>
      ) : null}

      {hostDisabled ? (
        <p className="border-b border-border bg-amber-100 px-5.5 py-2 text-[12.5px] text-amber-600">
          Hoàn thành tất cả câu hỏi (tối thiểu 1 câu) trước khi Host.
        </p>
      ) : null}

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-65 shrink-0 overflow-y-auto border-r border-border lg:block">
          {sidebar}
        </aside>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-70 p-0 sm:max-w-70">
          <SheetHeader className="border-b border-border">
            <SheetTitle className="font-heading text-heading">Câu hỏi</SheetTitle>
          </SheetHeader>
          {sidebar}
        </SheetContent>
      </Sheet>
    </div>
  );
}
