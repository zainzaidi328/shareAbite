"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Renders the pickup code as a QR image (dark-themed). */
export function PickupQr({ code, size = 160 }: { code: string; size?: number }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(code, {
      width: size,
      margin: 1,
      color: { dark: "#0A0A0F", light: "#FAFAFA" },
    }).then(setUrl);
  }, [code, size]);

  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`Pickup QR code ${code}`}
      width={size}
      height={size}
      className="rounded-lg border border-line"
    />
  );
}
