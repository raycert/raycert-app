import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SessionReportView } from "@/components/reports/SessionReportView";
import { getSessionReport } from "@/mocks/reports";

export default async function SessionReportPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const report = getSessionReport(sessionId);

  if (!report) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="font-heading text-[24px] font-bold leading-8 text-heading">
          Không tìm thấy báo cáo
        </h1>
        <p className="max-w-md text-base text-muted-foreground">
          Không tìm thấy report cho session &quot;{sessionId}&quot; trong mock data.
        </p>
        <Button variant="secondary" asChild>
          <Link href="/results">← Quay lại Results</Link>
        </Button>
      </div>
    );
  }

  return <SessionReportView report={report} />;
}
