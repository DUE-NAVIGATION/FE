import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import Disclaimer from "@/components/Disclaimer";
import SiteHeader from "@/components/SiteHeader";

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

/**
 * 큰 제목 전용 명조. 행정문서 같은 딱딱함 대신 손편지 같은 온기를 준다.
 * 본문에는 쓰지 않는다 — 작은 크기의 명조는 고령자에게 읽기 어렵다.
 */
const serifKr = Noto_Serif_KR({
  variable: "--font-serif-kr",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  // 공유 미리보기(opengraph-image.png)의 절대 주소를 만드는 기준. 프로덕션 도메인이다
  metadataBase: new URL("https://due-navigation.vercel.app"),
  title: "DUE — 복지 사각지대 내비게이터",
  description:
    "상황을 알려주면 연락할 수 있는 공공·민간 기관까지 이어주고, 함께 신청할 수 있는 지원금을 찾아주는 도구",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${plexSansKr.variable} ${plexMono.variable} ${serifKr.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col pb-24 sm:pb-16">
        {/* 모든 화면 위쪽의 옅은 번짐. 첫 화면은 자기 히어로가 덮는다 */}
        <div
          aria-hidden
          className="soft-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px]"
        />
        <SiteHeader />
        {/* 떠 있는 머리의 자리. 첫 화면 히어로는 이 자리까지 올라가 덮는다 */}
        <div aria-hidden className="h-24" />
        {children}
        <Disclaimer />
      </body>
    </html>
  );
}
