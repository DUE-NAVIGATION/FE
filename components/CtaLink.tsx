import Link from 'next/link';

/**
 * 주 행동 버튼 — 알약 모양, 오른쪽에 화살표가 든 작은 원.
 *
 * 누르면 살짝 눌리고(scale), 안쪽 원은 화살표 방향으로 밀려난다.
 * 움직임은 transform 만 쓴다.
 */
export default function CtaLink({
  href,
  children,
  tone = 'brand',
  size = 'lg',
}: {
  href: string;
  children: React.ReactNode;
  tone?: 'brand' | 'quiet';
  size?: 'md' | 'lg';
}) {
  const shell =
    tone === 'brand'
      ? 'bg-brand text-white shadow-[0_18px_40px_-18px_rgba(29,84,128,0.75)] hover:bg-brand-strong'
      : 'bg-white/80 text-foreground ring-1 ring-[rgba(120,80,45,0.12)] hover:bg-white';
  const dot = tone === 'brand' ? 'bg-white/15' : 'bg-[rgba(120,80,45,0.08)]';
  const pad = size === 'lg' ? 'py-2.5 pr-2.5 pl-7 text-[1.02rem]' : 'py-2 pr-2 pl-5 text-[0.9rem]';

  const inner = (
    <>
      <span className="font-semibold">{children}</span>
      <span
        aria-hidden
        className={`flex size-10 items-center justify-center rounded-full ${dot} transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-px group-hover:scale-105`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17L17 7M9 7h8v8" />
        </svg>
      </span>
    </>
  );

  const cls = `group inline-flex items-center gap-4 rounded-full ${pad} ${shell} transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]`;

  // tel: 같은 링크는 Next 라우터를 거치지 않는다
  if (!href.startsWith('/')) {
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}
