"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarNavList } from "./SidebarNav";

/** Sidebar-as-drawer for tablet/mobile (<1024px) — desktop uses the fixed `SidebarNav`. */
export function TrainerSidebarDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Mở menu điều hướng"
        className="lg:hidden"
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </Button>
      <SheetContent side="left" className="w-[240px] p-0 sm:max-w-[240px]">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="font-heading text-heading">RayCert</SheetTitle>
        </SheetHeader>
        <SidebarNavList onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
