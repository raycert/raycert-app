"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/(auth)/actions";
import type { TrainerProfile } from "@/lib/supabase/auth";
import { TrainerSidebarDrawer } from "./TrainerSidebarDrawer";
import { trainerNavItems } from "./nav-items";

// Dashboard lives in the sidebar/drawer only — the top bar repeats the rest,
// matching High-Fidelity V1 screen 01 (top bar nav: My Quizzes, Results).
const topBarNavItems = trainerNavItems.filter((item) => item.href !== "/dashboard");

function initialsFor(profile: TrainerProfile | null): string {
  const first = profile?.first_name?.trim()?.[0];
  const last = profile?.last_name?.trim()?.[0];
  const initials = `${last ?? ""}${first ?? ""}`.toUpperCase();
  return initials || "T";
}

function displayNameFor(profile: TrainerProfile | null): string {
  const name = [profile?.last_name, profile?.first_name].filter(Boolean).join(" ").trim();
  return name || profile?.email || "Trainer";
}

/** Phase 10B — `profile` comes from the server layout's `getCurrentProfile()`
 * (never fetched client-side here, avoiding a loading flash/flicker for
 * something the server already knows by the time this renders). `null`
 * means "signed in but no profiles row yet" (§11) — the menu still works,
 * just falls back to generic labels rather than crashing. */
export function NavBar({ profile }: { profile: TrainerProfile | null }) {
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Tài khoản: ${displayNameFor(profile)}`}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-primary transition-opacity hover:opacity-80"
            >
              {initialsFor(profile)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="font-semibold text-heading">{displayNameFor(profile)}</span>
              {profile?.email ? <span className="font-normal text-muted-foreground">{profile.email}</span> : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => signOutAction()}>
              <LogOutIcon />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
