"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { trainerNavItems } from "./nav-items";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[190px] shrink-0 border-r border-border bg-surface md:block">
      <nav className="flex flex-col gap-1 p-3">
        {trainerNavItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
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
    </aside>
  );
}
