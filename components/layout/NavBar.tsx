"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TrainerSidebarDrawer } from "./TrainerSidebarDrawer";
import { trainerNavItems } from "./nav-items";

// Dashboard lives in the sidebar/drawer only — the top bar repeats the rest,
// matching High-Fidelity V1 screen 01 (top bar nav: My Quizzes, Results).
const topBarNavItems = trainerNavItems.filter((item) => item.href !== "/dashboard");

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex items-center gap-3 sm:gap-8">
        <TrainerSidebarDrawer />
        <Link href="/dashboard" className="font-heading text-lg font-bold text-heading">
          RayCert
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {topBarNavItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-body transition-colors hover:bg-accent hover:text-accent-foreground",
                  active && "bg-secondary text-secondary-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <Button asChild>
          <Link href="/quizzes/new">
            <span className="hidden sm:inline">+ Create Quiz</span>
            <span className="sm:hidden">+ Quiz</span>
          </Link>
        </Button>
        <span
          aria-label="Trainer account (mock — chưa có auth)"
          title="Trainer account (mock)"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-primary"
        >
          T
        </span>
      </div>
    </header>
  );
}
