import { ImageResponse } from "next/og";

export function GET() {
  return new ImageResponse((<svg width="512" height="512" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#0C1F2E" /><rect x="10" y="12" width="23" height="16" rx="3.5" fill="none" stroke="#7CF2D2" strokeWidth="2" opacity="0.6" /><rect x="15" y="19" width="23" height="16" rx="3.5" fill="#0EC49A" /><rect x="19" y="22.5" width="5.5" height="4.2" rx="1.1" fill="#0C1F2E" opacity="0.8" /><rect x="19" y="30" width="15" height="2.4" rx="1.2" fill="#0C1F2E" opacity="0.28" /><rect x="19" y="30" width="9.5" height="2.4" rx="1.2" fill="#0C1F2E" /></svg>), { width: 512, height: 512 });
}
