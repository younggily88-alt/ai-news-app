import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 뉴스 모음",
  description: "해외 AI 뉴스를 한국어로 번역·요약·분류해 보여주는 앱",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Cache Components: ClerkProvider가 요청 시점 데이터를 읽으므로 Suspense 필요 */}
        <Suspense>
          <ClerkProvider>{children}</ClerkProvider>
        </Suspense>
      </body>
    </html>
  );
}
