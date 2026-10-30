import { ImageResponse } from "next/og";

export function GET() {
  return new ImageResponse((<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111111", color: "#ffffff", fontSize: 287, fontWeight: 700, borderRadius: 113 }}>P</div>), { width: 512, height: 512 });
}
