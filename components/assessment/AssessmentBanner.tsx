import { GraduationCapIcon } from "lucide-react";

/**
 * Banner — image/branding only (Start Screen UI fix-up §2/§7). Never renders
 * title/subtitle text or a gradient scrim for one — that responsibility
 * belongs entirely to `AssessmentHeader`, rendered as its own separate block
 * below this one. With no configured image, shows a plain Signal Blue
 * (`brand-900`) visual (no assessment text baked in) — purely branding, not
 * a text-bearing fallback card.
 */
export function AssessmentBanner({
  imageUrl,
  imageAlt,
}: {
  imageUrl?: string;
  imageAlt?: string;
}) {
  if (imageUrl) {
    return (
      <div className="w-full overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element -- local object/mock URL, not an optimizable remote asset */}
        <img
          src={imageUrl}
          alt={imageAlt ?? "Banner bài kiểm tra"}
          className="aspect-16/5 w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-16/5 w-full items-center justify-center rounded-lg bg-brand-900">
      <GraduationCapIcon className="size-10 text-white/60" aria-hidden="true" />
    </div>
  );
}
