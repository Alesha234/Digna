import { ImageResponse } from "next/og";

export function GET() {
  return new ImageResponse((<svg width="512" height="512" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0E1726" /><path d="M14 10h16a22 22 0 0 1 0 44H14z" fill="#FFFFFF" /><rect x="26" y="26" width="26" height="17" rx="5" fill="#FFB020" /><rect x="31" y="30.5" width="6.5" height="4.5" rx="1.3" fill="#0E1726" opacity="0.85" /></svg>), { width: 512, height: 512 });
}
