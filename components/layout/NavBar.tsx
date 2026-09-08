"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { trainerNavItems } from "./nav-items";

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="font-heading text-lg font-bold text-heading">
          RayCert
        </Link>
        <nav className="flex items-center gap-1">
          {trainerNavItems.map((item) => {
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
      <Button asChild>
        <Link href="/quizzes/new">Create Quiz</Link>
      </Button>
    </header>
  );
}
