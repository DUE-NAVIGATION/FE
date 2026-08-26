import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import Disclaimer from "@/components/Disclaimer";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "DUE — 복지 사각지대 내비게이터",
  description:
    "내 상황을 말하면 받을 수 있는 제도를 전부 찾아주고, 받은 서류를 쉬운 말로 풀어주는 도구",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col pb-16">
        {children}
        <Disclaimer />
      </body>
    </html>
  );
}
