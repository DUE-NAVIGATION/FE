import Image from 'next/image';
import Link from 'next/link';
import TextSizeToggle from '@/components/TextSizeToggle';

/**
 * 모든 화면 위에 떠 있는 섬 모양 머리.
 *
 * 로그인·마이페이지 메뉴가 없다 — 없는 것이 설계다 (설계 원칙 2).
 * 가는 곳은 둘뿐이라 햄버거 메뉴를 두지 않는다. 모바일에서도 그대로 보인다.
 * 흐림(backdrop-blur)은 고정 요소인 여기에만 쓴다.
 */
export default function SiteHeader() {
  return (
    <header className="no-print fixed inset-x-0 top-4 z-40 flex justify-center px-4">
      <div className="flex w-full max-w-max items-center gap-2 rounded-full bg-white/70 py-1.5 pr-1.5 pl-2 shadow-[0_12px_40px_-18px_rgba(110,65,25,0.35)] ring-1 ring-[rgba(120,80,45,0.1)] backdrop-blur-xl sm:gap-6">
        <Link href="/" className="flex items-center gap-2 rounded-full pr-2">
          <Logo />
          <span className="font-serif text-[1.05rem] font-bold tracking-[-0.02em]">DUE</span>
          <span className="hidden text-[0.72rem] text-faint md:inline">복지 사각지대 내비게이터</span>
        </Link>

        <nav className="flex items-center gap-1">
          <TextSizeToggle />
          <a
            href="tel:129"
            className="hidden rounded-full px-3.5 py-2 text-[0.82rem] text-muted transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[rgba(120,80,45,0.06)] sm:inline-flex"
          >
            급할 땐 <span className="tabular ml-1 font-semibold text-foreground">129</span>
          </a>
          <Link
            href="/start"
            className="rounded-full bg-brand px-4 py-2 text-[0.84rem] font-medium text-white transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-strong active:scale-[0.97]"
          >
            내 상황 입력하기
          </Link>
        </nav>
      </div>
    </header>
  );
}

/**
 * 대표 로고 — 두 점을 잇는 곡선. "이용자와 기관을 잇는다".
 * 원본은 저장소 밖 DUE_LOGO.png 이고, 여기 쓰는 것은 모서리를 투명하게 딴 128px 판이다.
 * 파비콘(app/icon.png)과 공유 미리보기(app/opengraph-image.png)도 같은 원본에서 나왔다.
 */
function Logo() {
  return (
    <Image
      src="/logo-mark.png"
      alt=""
      aria-hidden
      width={30}
      height={30}
      priority
      className="rounded-[9px]"
    />
  );
}
