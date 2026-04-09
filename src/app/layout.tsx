import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MangoI Video - 망고아이 화상영어",
  description: "WebRTC 기반 자체 화상영어 솔루션",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
