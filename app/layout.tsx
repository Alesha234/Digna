import type { ReactNode } from "react";
import "./shell/fonts.css";

export const metadata = { description: "PayProxy gives Cash App, Chime and prepaid card users a capped virtual card for each service that turns their card away. A working sandbox with sample money.", title: "PayProxy: capped virtual cards for when your card gets declined", appleWebApp: { capable: true, title: "PayProxy: capped virtual cards for when your card gets declined" } };
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
