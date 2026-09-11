import CtaLink from '@/components/CtaLink';
import Reveal from '@/components/Reveal';

/**
 * 첫 화면 (`/`) — 무엇을 해 주는 곳인지 10초 안에 알게 한다.
 *
 * 입력은 `/start` 에서 받는다. 여기서는 받지 않는다 — 처음 온 사람에게
 * 빈 칸부터 들이밀면 "또 뭘 써야 하나" 하고 닫는다.
 *
 * 톤: 따뜻한 크림 바탕 + 명조 제목 + 종이 질감. "손으로 쓴 안내문" 같은 온기.
 * 배치: 히어로는 좌우 분할(큰 글 / 겹쳐 놓은 카드), 세 걸음은 크기가 다른 벤토.
 *
 * ★ 제도명·시설명·금액을 여기에 적지 않는다. 전부 백엔드 응답에서 온다.
 *   그림 속 카드도 실제 기관이 아니라 모양만 보여주는 자리표시다.
 * ★ 움직임은 떠오르기 한 가지뿐이고, 움직임 줄이기 설정이면 꺼진다.
 */

const PROMISES = [
  { title: '저장하지 않습니다', body: '새로고침하면 사라집니다. 서버에도, 이 브라우저에도 남지 않습니다.' },
  { title: '로그인이 없습니다', body: '계정을 만들 필요가 없고, 누가 무엇을 물었는지 아무도 모릅니다.' },
  { title: '민감한 정보는 보내지 않습니다', body: '이름·주소·주민등록번호는 AI로 보내지 않습니다.' },
  { title: '단정하지 않습니다', body: '애매하면 "확인필요"라고 말씀드립니다. 최종 결정은 관할 기관이 합니다.' },
];

export default function Landing() {
  return (
    <main className="flex flex-col">
      {/* ══ 히어로 — 좌우 분할 ═════════════════════════════ */}
      <section className="hero-glow -mt-24 px-4 pt-36 pb-24 md:px-5 md:pt-44 md:pb-36">
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-16 lg:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col gap-7">
            <Reveal>
              <Eyebrow>로그인 없이 · 저장 없이 · 3분이면</Eyebrow>
            </Reveal>

            <Reveal delay={1}>
              {/* 줄마다 끊기지 않게 묶는다. "할지" 만 다음 줄로 떨어지면 문장이 무너진다 */}
              <h1 className="font-serif text-[clamp(2.2rem,5vw,3.7rem)] leading-[1.18] font-bold tracking-[-0.04em]">
                <span className="whitespace-nowrap">어디에 물어야 할지</span>
                <br />
                <span className="whitespace-nowrap">
                  몰라도 <span className="text-gradient">괜찮아요</span>
                </span>
              </h1>
            </Reveal>

            <Reveal delay={2}>
              <p className="max-w-[32ch] text-[1.14rem] leading-relaxed text-muted">
                상황을 알려주시면{' '}
                <strong className="font-semibold text-foreground">연락할 수 있는 기관</strong>
                까지 이어드립니다. 함께 신청할 수 있는 지원금도 찾아드려요.
              </p>
            </Reveal>

            <Reveal delay={3} className="flex flex-wrap items-center gap-3">
              <CtaLink href="/start">내 상황 입력하기</CtaLink>
              <CtaLink href="tel:129" tone="quiet" size="md">
                지금 급하시면 <span className="tabular">129</span>
              </CtaLink>
            </Reveal>

            <Reveal delay={4}>
              <p className="font-serif text-[1.02rem] text-foreground/75">
                — 이건 원래 당신 것입니다.
              </p>
            </Reveal>
          </div>

          <Reveal delay={2}>
            <HeroCascade />
          </Reveal>
        </div>
      </section>

      {/* ══ 세 걸음 — 벤토 ════════════════════════════════ */}
      <section className="mx-auto w-full max-w-[1180px] px-4 py-24 md:px-5 md:py-32">
        <Reveal>
          <SectionTitle eyebrow="이렇게 이어드려요" title="세 걸음이면 됩니다" />
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-12 md:grid-rows-2">
          <Reveal delay={0} className="md:col-span-7 md:row-span-2">
            <div className="bezel h-full">
              <div className="bezel-core flex h-full flex-col justify-between gap-10 p-8 md:p-10">
                <StepNo n="01" />
                <div className="flex flex-col gap-4">
                  <h3 className="font-serif text-[clamp(1.6rem,3vw,2.2rem)] leading-snug font-bold tracking-[-0.03em]">
                    아는 것만
                    <br />
                    알려주세요
                  </h3>
                  <p className="max-w-[36ch] text-[0.98rem] leading-relaxed text-muted">
                    사는 곳, 가족, 일 이야기면 충분합니다. 모르는 칸은 비워 두셔도
                    탈락시키지 않습니다 — &ldquo;확인필요&rdquo;로 남겨 무엇을 더 알면 되는지 알려드려요.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['사는 곳', '가족', '아이 나이', '일', '소득'].map((t) => (
                      <span key={t} className="rounded-full bg-surface px-3.5 py-1.5 text-[0.82rem] text-muted">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={1} className="md:col-span-5">
            <div className="bezel h-full">
              <div className="bezel-core flex h-full flex-col gap-4 p-7">
                <StepNo n="02" />
                <h3 className="font-serif text-[1.35rem] font-bold tracking-[-0.03em]">
                  규칙이 하나하나 따져봅니다
                </h3>
                <p className="text-[0.92rem] leading-relaxed text-muted">
                  AI가 짐작하지 않습니다. 공고문의 조건을 옮긴 규칙으로 판정하고, 조건마다
                  근거를 보여드립니다.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={2} className="md:col-span-5">
            <div className="bezel h-full">
              <div className="bezel-core flex h-full flex-col gap-4 bg-gradient-to-br from-white to-warm-weak/60 p-7">
                <StepNo n="03" />
                <h3 className="font-serif text-[1.35rem] font-bold tracking-[-0.03em]">
                  전화 한 통으로 이어집니다
                </h3>
                <p className="text-[0.92rem] leading-relaxed text-muted">
                  갈 수 있는 곳의 번호·주소·준비물, 그리고 전화로 할 말까지 정리해 드립니다.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ 공공 · 민간 ══════════════════════════════════ */}
      <section className="mx-auto w-full max-w-[1180px] px-4 pb-24 md:px-5 md:pb-32">
        <Reveal>
          <SectionTitle eyebrow="결과는 이렇게 나뉩니다" title="공공과 민간을 따로 보여드려요" />
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <div className="bezel h-full">
              <div className="bezel-core flex h-full flex-col gap-3 bg-gradient-to-br from-brand-weak to-white p-8 md:p-10">
                <span className="w-fit rounded-full bg-brand px-3.5 py-1 text-[0.76rem] font-semibold text-white">공공</span>
                <h3 className="mt-2 font-serif text-[1.6rem] font-bold tracking-[-0.03em]">나라와 지자체가 세운 곳</h3>
                <p className="max-w-[40ch] text-[0.95rem] leading-relaxed text-muted">
                  대부분 무료이고, 관할 지역에 사시면 이용하실 수 있습니다. 운영을 민간에
                  맡겼더라도 공공이 세운 곳이면 여기에 둡니다.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={1} className="md:col-span-5">
            <div className="bezel h-full">
              <div className="bezel-core flex h-full flex-col gap-3 bg-gradient-to-br from-warm-weak to-white p-8">
                <span className="w-fit rounded-full bg-warm-strong px-3.5 py-1 text-[0.76rem] font-semibold text-white">민간</span>
                <h3 className="mt-2 font-serif text-[1.4rem] font-bold tracking-[-0.03em]">법인·단체가 운영하는 곳</h3>
                <p className="text-[0.92rem] leading-relaxed text-muted">
                  이용료나 정원이 있을 수 있어 전화로 먼저 확인하시길 권합니다.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ 약속 — 편집 목록 ══════════════════════════════ */}
      <section className="mx-auto w-full max-w-[1180px] px-4 pb-24 md:px-5 md:pb-32">
        <div className="grid gap-12 md:grid-cols-[1fr_1.5fr] md:gap-20">
          <Reveal>
            <SectionTitle eyebrow="이 서비스가 지키는 것" title="묻는 사람을 지키는 것부터" />
          </Reveal>
          <ol className="flex flex-col">
            {PROMISES.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-[rgba(120,80,45,0.12)] py-7 last:border-b">
                <span className="tabular pt-1 text-[0.8rem] text-warm-strong">0{i + 1}</span>
                <div>
                  <h3 className="font-serif text-[1.2rem] font-bold tracking-[-0.02em]">{p.title}</h3>
                  <p className="mt-1.5 text-[0.93rem] leading-relaxed text-muted">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ══ 마무리 ═══════════════════════════════════════ */}
      <section className="mx-auto w-full max-w-[1180px] px-4 pb-28 md:px-5 md:pb-36">
        <Reveal>
          <div className="bezel">
            <div className="bezel-core hero-glow flex flex-col items-center gap-7 px-6 py-20 text-center md:py-28">
              <Eyebrow>여기서부터</Eyebrow>
              <h2 className="font-serif text-[clamp(1.8rem,4.2vw,2.9rem)] leading-snug font-bold tracking-[-0.035em]">
                혼자 알아보느라 지치셨다면
                <br />
                같이 찾아요
              </h2>
              <CtaLink href="/start">시작하기</CtaLink>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-3.5 py-1.5 text-[0.74rem] font-medium tracking-[0.08em] text-warm-strong ring-1 ring-warm/25">
      <span aria-hidden className="block size-1.5 rounded-full bg-warm" />
      {children}
    </span>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col gap-4">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="font-serif text-[clamp(1.8rem,3.8vw,2.7rem)] leading-[1.25] font-bold tracking-[-0.035em]">
        {title}
      </h2>
    </div>
  );
}

function StepNo({ n }: { n: string }) {
  return (
    <span className="tabular flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ffd2b8] to-[#ffe9bd] text-[0.9rem] font-medium text-warm-strong shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
      {n}
    </span>
  );
}

/**
 * 히어로 오른쪽 — 종이 카드를 겹쳐 놓은 모양. 결과 화면의 흐름을 모양으로만 보여준다.
 * 768px 아래에서는 기울기와 겹침을 풀고 그냥 쌓는다 (손가락이 엉뚱한 카드를 누르지 않게).
 * ★ 실제 기관명·번호를 넣지 않는다 — 가짜 번호는 누가 눌러볼 수도 있다.
 */
function HeroCascade() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[460px] select-none">
      <div className="absolute -top-10 -left-8 size-48 rounded-full bg-[#ffd3b9]/60 blur-3xl" />
      <div className="absolute -right-8 -bottom-6 size-52 rounded-full bg-[#cfe2f5]/70 blur-3xl" />

      <div className="relative flex flex-col gap-4 md:gap-0">
        <div className="bezel md:ml-12 md:-rotate-2">
          <div className="bezel-core p-6">
            <p className="text-[0.76rem] text-faint">알려주신 것</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['사는 곳', '가족', '아이 나이', '일'].map((t) => (
                <span key={t} className="rounded-full bg-surface px-3 py-1 text-[0.8rem] text-muted">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bezel relative z-10 md:-mt-4 md:mr-8 md:rotate-1">
          <div className="bezel-core p-6">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-weak px-2.5 py-0.5 text-[0.72rem] font-semibold text-brand">공공</span>
              <span className="rounded-full bg-pass-weak px-2.5 py-0.5 text-[0.72rem] font-semibold text-pass">해당</span>
            </div>
            <div className="mt-4 h-3.5 w-[68%] rounded-full bg-foreground/80" />
            <div className="mt-2.5 h-2.5 w-[90%] rounded-full bg-border" />
            <div className="mt-1.5 h-2.5 w-[58%] rounded-full bg-border" />
            <div className="mt-5 flex items-center justify-between rounded-full bg-brand py-2 pr-2 pl-5 text-[0.88rem] font-semibold text-white">
              전화 한 통이면 됩니다
              <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <div className="bezel md:-mt-3 md:ml-20 md:-rotate-1">
          <div className="bezel-core flex items-center gap-3 p-4">
            <span className="rounded-full bg-warm-weak px-2.5 py-0.5 text-[0.72rem] font-semibold text-warm-strong">민간</span>
            <div className="h-2.5 flex-1 rounded-full bg-border" />
            <span className="text-[0.76rem] text-faint">준비물 · 할 말</span>
          </div>
        </div>
      </div>
    </div>
  );
}
