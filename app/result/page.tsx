'use client';

/**
 * 판정 결과 화면 (`/result`).
 *
 * ★ 여기서 판정하지 않는다. 백엔드가 준 `results` 를 상태별로 묶어 그릴 뿐이다.
 *   정렬도 하지 않는다 — 해당 → 확인필요 → 미해당 순으로 이미 정렬되어 온다.
 *
 * ★ 새로고침하면 결과가 사라진다. 버그가 아니라 기능이다 (설계 원칙 2).
 *   그 사실을 감추지 않고 화면으로 설명한다. 데모의 핵심 장면이다.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { MatchResult, MatchStatus } from '@/types';
import { ApiError, explain } from '@/lib/api';
import { useSession } from '@/lib/session';
import ProgramRow from '@/components/ProgramRow';
import ResultSummary from '@/components/ResultSummary';

const GROUPS: Array<{
  status: MatchStatus;
  title: string;
  note: string;
  noteTone: string;
}> = [
  {
    status: 'ELIGIBLE',
    title: '받으실 수 있습니다',
    note: '지금 신청 가능',
    noteTone: 'text-faint',
  },
  {
    status: 'NEEDS_INFO',
    title: '몇 가지만 확인되면 판단할 수 있습니다',
    note: '안 된다는 뜻이 아닙니다',
    noteTone: 'text-unknown',
  },
  {
    status: 'INELIGIBLE',
    title: '이번에는 해당되지 않습니다',
    note: '이유를 함께 적어 둡니다',
    noteTone: 'text-faint',
  },
];

export default function ResultPage() {
  const result = useSession((s) => s.result);
  const explanation = useSession((s) => s.explanation);
  const setExplanation = useSession((s) => s.setExplanation);
  const [writing, setWriting] = useState(false);

  // 같은 결과에 대해 두 번 부르지 않는다. AI 호출은 돈이 든다
  const asked = useRef(false);

  useEffect(() => {
    if (!result || explanation || asked.current) return;
    asked.current = true;

    let alive = true;
    setWriting(true);
    explain({ results: result.results, summary: result.summary })
      .then((r) => {
        if (alive) setExplanation(r.explanation);
      })
      .catch((e: ApiError) => {
        // ★ 설명문은 덤이다. 없어도 이 화면은 완전히 동작한다.
        //   AI 가 없거나(503) 실패해도(502) 화면에 오류를 띄우지 않는다 —
        //   판정 결과와 조건별 근거가 이미 다 나와 있기 때문이다.
        if (!e.isAiFallback) console.warn('설명 생성 실패:', e.code);
      })
      .finally(() => {
        if (alive) setWriting(false);
      });

    return () => {
      alive = false;
    };
  }, [result, explanation, setExplanation]);

  // 새로고침했거나 결과 없이 직접 들어온 경우
  if (!result) {
    return <NoResult />;
  }

  const { results, summary, incomePct, medianIncomeYear, disclaimer } = result;

  return (
    <main className="mx-auto w-full max-w-[1000px] px-5 py-12 md:py-16">
      <p className="font-mono text-[0.68rem] tracking-[0.14em] text-faint">
        판정 결과 · 규칙 엔진 산출 · 저장하지 않음
      </p>

      <div className="mt-6">
        <ResultSummary
          summary={summary}
          incomePct={incomePct}
          medianIncomeYear={medianIncomeYear}
        />
      </div>

      {/* AI 설명문. 없어도 결과 화면은 완전히 동작한다 */}
      {writing && !explanation && (
        <div className="mt-8 flex flex-col gap-2 rounded-[3px] border-l-[3px] border-border bg-surface px-5 py-4">
          <span className="font-mono text-[0.68rem] tracking-[0.14em] text-faint">
            읽기 쉬운 설명을 쓰는 중
          </span>
          <span className="h-3 w-[85%] animate-pulse rounded-[2px] bg-border-soft" />
          <span className="h-3 w-[60%] animate-pulse rounded-[2px] bg-border-soft" />
        </div>
      )}
      {explanation && (
        <p className="mt-8 rounded-[3px] border-l-[3px] border-brand bg-brand-weak px-5 py-4 text-[0.95rem] leading-relaxed text-muted">
          {explanation}
        </p>
      )}

      {GROUPS.map((g) => {
        const rows = results.filter((r) => r.status === g.status);
        if (rows.length === 0) return null;
        return <Group key={g.status} {...g} rows={rows} />;
      })}

      {results.length === 0 && <EmptyResults />}

      <p className="mt-10 flex flex-wrap items-baseline gap-x-4 gap-y-2 rounded-[3px] bg-surface px-5 py-4 text-[0.86rem] text-muted">
        <strong className="font-semibold text-foreground">{disclaimer}.</strong>
        <span>
          이 화면은 안내이며 공식 판정이 아닙니다. 금액은 조건이 모두 충족될 때의
          예상액입니다.
        </span>
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-[3px] bg-brand px-6 py-3 text-[0.95rem] font-medium text-white transition-colors hover:bg-brand-strong active:translate-y-px"
        >
          결과를 PDF로 저장
        </button>
        <Link
          href="/"
          className="rounded-[3px] border border-border px-6 py-3 text-[0.95rem] font-medium text-brand transition-colors hover:bg-brand-weak"
        >
          값 고쳐서 다시 보기
        </Link>
      </div>
      <p className="mt-3 text-[0.82rem] text-faint">
        공유 링크는 만들지 않습니다. 저장은 이 기기에만 남습니다.
      </p>
    </main>
  );
}

function Group({
  title,
  note,
  noteTone,
  rows,
}: {
  title: string;
  note: string;
  noteTone: string;
  rows: MatchResult[];
}) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-foreground pt-10 pb-2">
        <h2 className="text-[1.02rem] font-semibold">{title}</h2>
        <span className="font-mono text-[0.8rem] text-faint">{rows.length}건</span>
        <span className={`ml-auto text-[0.82rem] ${noteTone}`}>{note}</span>
      </div>
      <div className="border-b border-border">
        {rows.map((r, i) => (
          <ProgramRow key={r.program.id} result={r} index={i} />
        ))}
      </div>
    </section>
  );
}

/** 제도는 읽혔지만 어느 것도 매칭되지 않은 경우 */
function EmptyResults() {
  return (
    <div className="mt-10 rounded-[3px] border border-border px-6 py-10 text-center">
      <p className="text-[1rem] font-semibold">
        지금 입력으로는 해당되는 제도를 찾지 못했습니다
      </p>
      <p className="mx-auto mt-2 max-w-[46ch] text-[0.9rem] text-muted">
        조건이 하나만 달라져도 결과가 바뀝니다. 소득이나 주거 형태를 채우면 다시
        판정해 보겠습니다.
      </p>
      <Link
        href="/"
        className="mt-5 inline-block rounded-[3px] border border-border px-5 py-2.5 text-[0.88rem] text-brand transition-colors hover:bg-brand-weak"
      >
        값 더 입력하기
      </Link>
    </div>
  );
}

/**
 * 새로고침 후의 화면.
 *
 * "오류가 났습니다" 로 쓰지 않는다. 의도한 동작이고, 그 이유를 설명하는 것이
 * 이 서비스가 하려는 말이다.
 */
function NoResult() {
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-5 py-24">
      <p className="font-mono text-[0.68rem] tracking-[0.14em] text-faint">
        세션 없음
      </p>
      <h1 className="text-[1.6rem] leading-snug font-semibold tracking-[-0.02em]">
        결과가 사라졌습니다.
        <br />
        그렇게 만들었습니다.
      </h1>
      <p className="text-[0.95rem] text-muted">
        DUE는 입력하신 내용을 어디에도 저장하지 않습니다. 서버에도, 이 브라우저에도
        남기지 않기 때문에 새로고침하면 결과가 없어집니다. 불편하지만, 그게
        요점입니다.
      </p>
      <Link
        href="/"
        className="mt-2 self-start rounded-[3px] bg-brand px-6 py-3 text-[0.95rem] font-medium text-white transition-colors hover:bg-brand-strong active:translate-y-px"
      >
        처음부터 다시 하기
      </Link>
    </main>
  );
}
