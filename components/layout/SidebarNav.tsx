"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { trainerNavItems } from "./nav-items";

export function SidebarNavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {trainerNavItems.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "rounded-md border-l-[3px] border-transparent px-3 py-2 text-sm font-medium text-body transition-colors hover:bg-accent",
              active && "border-primary bg-secondary text-secondary-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Fixed sidebar — desktop only (>=1024px). Tablet/mobile use `TrainerSidebarDrawer`. */
export function SidebarNav() {
  return (
    <aside className="hidden w-[190px] shrink-0 border-r border-border bg-surface lg:block">
      <SidebarNavList />
    </aside>
  );
}
