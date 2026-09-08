import type { ReactNode } from "react";
import { MobileShell } from "@/components/layout/MobileShell";

export default function PlaySessionLayout({ children }: { children: ReactNode }) {
  return <MobileShell>{children}</MobileShell>;
}
