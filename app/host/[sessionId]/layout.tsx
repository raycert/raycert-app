import type { ReactNode } from "react";
import { HostShell } from "@/components/layout/HostShell";

export default function HostSessionLayout({ children }: { children: ReactNode }) {
  return <HostShell>{children}</HostShell>;
}
