import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { QuestionTypeBadge } from "@/components/quiz/QuestionTypeBadge";
import { ToastDemoButton } from "./toast-demo-button";

const colorGroups: { title: string; tokens: { name: string; className: string; hex: string }[] }[] = [
  {
    title: "Brand",
    tokens: [
      { name: "brand-900", className: "bg-brand-900", hex: "#07294f" },
      { name: "brand-700", className: "bg-brand-700", hex: "#1d4371" },
      { name: "brand-500", className: "bg-brand-500", hex: "#345f95" },
      { name: "brand-100", className: "bg-brand-100", hex: "#e2ecf9" },
    ],
  },
  {
    title: "Teal accent (POLL)",
    tokens: [
      { name: "teal-500", className: "bg-teal-500", hex: "#2ca2a2" },
      { name: "teal-100", className: "bg-teal-100", hex: "#d5f2f1" },
    ],
  },
  {
    title: "Amber accent (warning / timer)",
    tokens: [
      { name: "amber-600", className: "bg-amber-600", hex: "#d6810c" },
      { name: "amber-500", className: "bg-amber-500", hex: "#e99b2a" },
      { name: "amber-100", className: "bg-amber-100", hex: "#ffebd2" },
    ],
  },
  {
    title: "Success / Error (QUIZ only)",
    tokens: [
      { name: "success-600", className: "bg-success-600", hex: "#1e7729" },
      { name: "success-100", className: "bg-success-100", hex: "#d7f5d7" },
      { name: "error-600", className: "bg-error-600", hex: "#be222a" },
      { name: "error-100", className: "bg-error-100", hex: "#ffe5e1" },
    ],
  },
  {
    title: "Neutral / Surface / Text",
    tokens: [
      { name: "background", className: "bg-background border border-border", hex: "#f2f6f9" },
      { name: "surface", className: "bg-surface border border-border", hex: "#ffffff" },
      { name: "border", className: "bg-border", hex: "#dfe2e4" },
      { name: "border-strong", className: "bg-border-strong", hex: "#cbced1" },
      { name: "text-heading", className: "bg-heading", hex: "#181b1d" },
      { name: "text-body", className: "bg-body", hex: "#4a4e50" },
      { name: "text-muted", className: "bg-muted-foreground", hex: "#7d8183" },
    ],
  },
];

const typeScale: { name: string; spec: string; className: string; sample: string }[] = [
  { name: "Display", spec: "Manrope 40/48 · 800", className: "font-heading text-[40px] font-extrabold leading-12", sample: "RayCert" },
  { name: "H1", spec: "Manrope 32/40 · 700", className: "font-heading text-[32px] font-bold leading-10", sample: "Trainer Dashboard" },
  { name: "H2", spec: "Manrope 24/32 · 700", className: "font-heading text-2xl font-bold leading-8", sample: "Câu hỏi 3 / 10" },
  { name: "H3", spec: "Manrope 19/28 · 600", className: "font-heading text-[19px] font-semibold leading-7", sample: "Kết quả phiên" },
  { name: "Body Large", spec: "Inter 17/26 · 500", className: "text-[17px] font-medium leading-6.5", sample: "Đâu là thủ đô của Việt Nam?" },
  { name: "Body", spec: "Inter 16/24 · 400", className: "text-base leading-6", sample: "Nhấn Start để bắt đầu câu hỏi." },
  { name: "Label", spec: "Inter 13/18 · 600 · upper", className: "text-[13px] font-semibold uppercase leading-4.5 tracking-wide", sample: "RESPONSE COUNT" },
  { name: "Caption", spec: "Inter 12/16 · 400", className: "text-xs leading-4", sample: "32 người đã trả lời" },
  { name: "Button", spec: "Inter 14/20 · 600", className: "text-sm font-semibold leading-5", sample: "Start Question" },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-2xl font-bold leading-8 text-heading">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-16">
      <header className="flex flex-col gap-2 border-b border-border pb-8">
        <p className="text-[13px] font-semibold uppercase leading-4.5 tracking-wide text-muted-foreground">
          RayCert — dev only
        </p>
        <h1 className="font-heading text-[40px] font-extrabold leading-12 text-heading">
          Design System
        </h1>
        <p className="text-base text-muted-foreground">
          Reference page for colors, typography, and base components. Not part of the
          production app.
        </p>
      </header>

      <Section title="Colors" description="docs/design/README.md §8">
        <div className="flex flex-col gap-6">
          {colorGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <p className="text-[13px] font-semibold uppercase leading-4.5 tracking-wide text-muted-foreground">
                {group.title}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {group.tokens.map((token) => (
                  <div
                    key={token.name}
                    className="overflow-hidden rounded-lg border border-border"
                  >
                    <div className={`h-14 ${token.className}`} />
                    <div className="flex flex-col gap-0.5 p-2.5">
                      <span className="text-xs font-bold">{token.name}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {token.hex}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography" description="docs/design/README.md §9 — Manrope for headings, Inter for body/UI">
        <Card>
          <CardContent className="flex flex-col divide-y divide-border p-0">
            {typeScale.map((t) => (
              <div
                key={t.name}
                className="grid grid-cols-[110px_1fr_auto] items-center gap-4 px-5 py-4"
              >
                <span className="text-xs font-bold text-muted-foreground">{t.name}</span>
                <span className={`${t.className} text-heading`}>{t.sample}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{t.spec}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="touch">Touch (44px)</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </Section>

      <Section title="Inputs">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold uppercase leading-4.5 tracking-wide text-muted-foreground">
              Input
            </label>
            <Input placeholder="Nhập tiêu đề quiz" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold uppercase leading-4.5 tracking-wide text-muted-foreground">
              Input — error
            </label>
            <Input placeholder="Nhập tiêu đề quiz" aria-invalid />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold uppercase leading-4.5 tracking-wide text-muted-foreground">
              Textarea
            </label>
            <Textarea placeholder="Mô tả quiz" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold uppercase leading-4.5 tracking-wide text-muted-foreground">
              Select
            </label>
            <Select defaultValue="QUIZ">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Loại câu hỏi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="QUIZ">Trắc nghiệm (QUIZ)</SelectItem>
                <SelectItem value="POLL">Bình chọn (POLL)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </Section>

      <Section title="QUIZ / POLL distinction" description="components/quiz/QuestionTypeBadge.tsx">
        <div className="flex flex-wrap items-center gap-3">
          <QuestionTypeBadge type="QUIZ" />
          <QuestionTypeBadge type="POLL" />
        </div>
      </Section>

      <Section title="Progress">
        <Progress value={64} className="max-w-sm" />
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Quiz</CardTitle>
              <CardDescription>10 câu hỏi · Published</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Card mặc định — surface trắng, border neutral-200, radius 12px, shadow-sm.
              </p>
            </CardContent>
          </Card>
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>Compliance Refresher</CardTitle>
              <CardDescription>6 câu hỏi · Published</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Hover state — shadow-md khi card có thể click.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Toast" description="sonner, mounted globally in app/layout.tsx">
        <ToastDemoButton />
      </Section>
    </div>
  );
}
