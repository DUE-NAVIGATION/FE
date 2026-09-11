import Link from 'next/link';

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

/** 길잡이 표식 — 두 점을 잇는 곡선. "당신과 시설을 잇는다" */
function Logo() {
  return (
    <svg aria-hidden width="30" height="30" viewBox="0 0 34 34" fill="none">
      <defs>
        <linearGradient id="due-logo" x1="0" y1="0" x2="34" y2="34">
          <stop offset="0" stopColor="#f29a6c" />
          <stop offset="1" stopColor="#1d5480" />
        </linearGradient>
      </defs>
      <rect width="34" height="34" rx="17" fill="url(#due-logo)" />
      <path d="M9.5 23.5c3-8 12-5 15-13" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="9.5" cy="23.5" r="2.3" fill="#fff" />
      <circle cx="24.5" cy="10.5" r="2.3" fill="#fff" />
    </svg>
  );
}
