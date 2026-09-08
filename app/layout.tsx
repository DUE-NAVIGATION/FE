import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";
import Disclaimer from "@/components/Disclaimer";

/*
 * 본문은 IBM Plex Sans KR.
 * Noto Sans KR 은 한국어 웹의 기본값이라 성격이 없고, Plex 는 한글 자소가
 * 또렷해 발표 화면(1920×1080 프로젝터)에서 덜 뭉갠다.
 *
 * ★ subsets 에 "korean" 을 넣을 수 없다 — next/font 가 이 패밀리에는 latin /
 *   latin-ext 만 이름으로 노출한다. 한글 글리프는 unicode-range 로 쪼개진
 *   슬라이스에 담겨 함께 내려오므로 렌더링에는 문제가 없다. 다만 미리 불러오지는
 *   않으므로, 첫 화면에서 한글이 늦게 뜨면 여기부터 의심할 것.
 */
const plexSansKr = IBM_Plex_Sans_KR({
  variable: "--font-plex-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/** 금액·비율·필드명 전용. 자릿수가 흔들리면 안 된다 */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
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
    <html
      lang="ko"
      className={`${plexSansKr.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-16">
        {children}
        <Disclaimer />
      </body>
    </html>
  );
}
