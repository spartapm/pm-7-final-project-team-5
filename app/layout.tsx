import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { CloudBanner } from "@/components/CloudBanner";

export const metadata: Metadata = {
  title: "패턴노트",
  description: "매매 판단 패턴을 기록하고 반복되는 습관을 발견하세요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        <Providers>
          <CloudBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
