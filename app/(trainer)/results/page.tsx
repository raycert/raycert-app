import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ResultsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-[13px] font-semibold leading-4.5 tracking-wide text-muted-foreground uppercase">
        Results Dashboard
      </p>
      <h1 className="font-heading text-[24px] font-bold leading-8 text-heading">
        Results Dashboard sẽ được triển khai ở phase sau
      </h1>
      <p className="max-w-md text-base text-muted-foreground">
        Route này đã sẵn sàng cho Session history + Game Report — hiện tại chỉ là placeholder của
        Phase 2.
      </p>
      <Button variant="secondary" asChild>
        <Link href="/dashboard">← Quay lại Dashboard</Link>
      </Button>
    </div>
  );
}
