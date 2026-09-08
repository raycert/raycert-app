import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewQuizPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-[13px] font-semibold leading-4.5 tracking-wide text-muted-foreground uppercase">
        Quiz Editor
      </p>
      <h1 className="font-heading text-[24px] font-bold leading-8 text-heading">
        Quiz Editor sẽ được triển khai ở Phase 3
      </h1>
      <p className="max-w-md text-base text-muted-foreground">
        Route này đã sẵn sàng cho Quiz Editor thật — hiện tại chỉ là placeholder của Phase 2.
      </p>
      <Button variant="secondary" asChild>
        <Link href="/quizzes">← Quay lại My Quizzes</Link>
      </Button>
    </div>
  );
}
