import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockQuizzes } from "@/mocks";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-[32px] font-bold leading-10 text-heading">
          Trainer Dashboard
        </h1>
        <p className="text-base text-muted-foreground">
          App shell only (Phase 1) — content follows in a later milestone.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Quizzes (mock)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {mockQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="flex items-center justify-between border-b border-border py-2 last:border-0"
            >
              <span className="text-sm font-medium">{quiz.title}</span>
              <span className="text-xs text-muted-foreground">
                {quiz.questions.length} câu hỏi · {quiz.status}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
