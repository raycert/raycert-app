"use client";

import { AssessmentBannerUpload } from "./AssessmentBannerUpload";

/**
 * "Banner bài kiểm tra" editor section (Start Screen UI fix-up §8) — upload
 * only. No Banner title/subtitle inputs — the banner is image/branding only
 * now, never overlaid with text (Assessment's own title/description are
 * edited elsewhere and rendered as `AssessmentHeader` on the Start Screen).
 * Capped to a fixed width so the 16:5 aspect ratio doesn't dominate the
 * desktop editor page.
 */
export function AssessmentBannerSection({
  bannerImageUrl,
  bannerFileName,
  onUploadBanner,
  onRemoveBanner,
}: {
  bannerImageUrl?: string;
  bannerFileName?: string;
  onUploadBanner: (url: string, fileName: string, mimeType: string) => void;
  onRemoveBanner: () => void;
}) {
  return (
    <div className="max-w-160">
      <AssessmentBannerUpload
        bannerImageUrl={bannerImageUrl}
        bannerFileName={bannerFileName}
        onUploaded={onUploadBanner}
        onRemove={onRemoveBanner}
      />
    </div>
  );
}
