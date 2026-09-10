"use client";

import { QRCodeSVG } from "qrcode.react";

/**
 * Renders a QR code for `url`. URL is always passed in via props — this
 * component never constructs or hard-codes a domain itself. `title` becomes
 * the QR SVG's native accessible name (`<title>`, read by screen readers) —
 * defaults to a generic description so every existing call site stays
 * accessible without needing to pass anything new.
 */
export function GameQRCode({
  url,
  size = 220,
  title = "Mã QR để tham gia",
  className,
}: {
  url: string;
  size?: number;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-lg bg-white p-4 shadow-lg ${className ?? ""}`}
    >
      <QRCodeSVG value={url} size={size} bgColor="#ffffff" fgColor="#181b1d" level="M" title={title} />
    </div>
  );
}
