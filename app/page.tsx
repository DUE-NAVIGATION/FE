import BackendStatus from '@/components/BackendStatus';

/**
 * Phase 0 자리표시자 화면.
 * Phase 5 에서 대화형 입력 화면으로 교체된다.
 */

const phases = [
  { name: 'Phase 0 — 셋업 + 타입 정의 (BE/FE 분리)', owner: '공통', done: true },
  { name: 'Phase 1 — 규칙 엔진 com.due.rules', owner: 'BE', done: false },
  { name: 'Phase 2 — 소득 계산 + 중복수급', owner: 'BE', done: false },
  { name: 'Phase 3 — 제도 데이터 resources/programs', owner: '데이터', done: false },
  { name: 'Phase 4 — AI 구조화 com.due.ai', owner: 'BE', done: false },
  { name: 'Phase 5 — 결과 화면 · 대화형 입력', owner: 'FE', done: false },
  { name: 'Phase 6 — 문서 번역', owner: 'BE/FE', done: false },
  { name: 'Phase 7 — 데모 안정화', owner: '공통', done: false },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <p className="text-sm font-medium tracking-widest text-brand">DUE</p>
      <h1 className="mt-2 text-4xl font-bold">복지 사각지대 내비게이터</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        내 상황을 말하면 받을 수 있는 제도를 전부 찾아주고, 받은 서류를 쉬운
        말로 풀어주는 도구. <br />
        <span className="text-foreground">
          due — &ldquo;마땅히 지급되어야 할&rdquo;. 이건 원래 당신 것입니다.
        </span>
      </p>

      <section className="mt-10 rounded-lg border border-border bg-brand-weak p-5">
        <BackendStatus />
      </section>

      <section className="mt-6 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-xl font-bold">진행 현황</h2>
        <ul className="mt-4 space-y-2">
          {phases.map((p) => (
            <li key={p.name} className="flex items-start gap-3">
              <span aria-hidden className={p.done ? 'text-pass' : 'text-muted'}>
                {p.done ? '✅' : '▫'}
              </span>
              <span className={p.done ? 'font-medium' : 'text-muted'}>
                {p.name}
              </span>
              <span className="ml-auto shrink-0 rounded border border-border bg-background px-2 text-sm text-muted">
                {p.owner}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
