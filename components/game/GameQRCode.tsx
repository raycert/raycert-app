"use client";

import { QRCodeSVG } from "qrcode.react";

/**
 * Renders a QR code for `url`. URL is always passed in via props — this
 * component never constructs or hard-codes a domain itself.
 */
export function GameQRCode({
  url,
  size = 220,
  className,
}: {
  url: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-lg bg-white p-4 shadow-lg ${className ?? ""}`}
    >
      <QRCodeSVG value={url} size={size} bgColor="#ffffff" fgColor="#181b1d" level="M" />
    </div>
  );
}
