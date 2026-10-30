import type { ReactNode } from "react";

export const metadata = { title: "PayProxy: virtual cards with spending caps, for people wh…", appleWebApp: { capable: true, title: "PayProxy: virtual cards with spending caps, for people wh…" } };
export const viewport = { themeColor: "#111111" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: "if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));" }} />
      </body>
    </html>
  );
}
