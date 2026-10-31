import type { ReactNode } from "react";
import "./shell/fonts.css";

export const metadata = { description: "Digna gives Cash App, Chime and prepaid card users a card for each place that turns their card away, with a limit they choose. Free to try with practice money.", title: "Digna: dignity at every checkout", appleWebApp: { capable: true, title: "Digna: dignity at every checkout" } };
export const viewport = { themeColor: "#0E1726" };

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
