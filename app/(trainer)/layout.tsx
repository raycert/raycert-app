import type { ReactNode } from "react";
import { NavBar } from "@/components/layout/NavBar";
import { SidebarNav } from "@/components/layout/SidebarNav";

export default function TrainerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <div className="flex flex-1">
        <SidebarNav />
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
