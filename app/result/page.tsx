'use client';

/**
 * 결과 화면 (`/result`).
 *
 * ★ 2026-09-10 방향 전환 — 주인공이 시설이다.
 *   "얼마 받을 수 있나" 보다 "어디로 가면 되나" 가 먼저 필요한 사람이 많다.
 *   제도를 알아도 어디에 물어야 할지 모르면 결국 도달하지 못한다.
 *   그래서 연락할 수 있는 곳이 위, 지원금이 아래다.
 *
 * ★ 여기서 판정하지 않는다. 백엔드가 준 것을 상태별로 묶어 그릴 뿐이다.
 *   정렬도 하지 않는다 — 이용 가능 → 확인 필요 → 관할 밖 순, 같은 상태에서는
 *   24시간 운영이 먼저 오도록 이미 정렬되어 온다.
 *
 * ★ 새로고침하면 사라진다. 버그가 아니라 기능이다 (설계 원칙 2).
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { FacilityMatch, MatchResult, MatchStatus } from '@/types';
import { ApiError, explain } from '@/lib/api';
import { useSession } from '@/lib/session';
import FacilityCard from '@/components/FacilityCard';
import ProgramRow from '@/components/ProgramRow';
import ResultSummary from '@/components/ResultSummary';

const PROGRAM_GROUPS: Array<{
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
  const context = useSession((s) => s.context);
  const explanation = useSession((s) => s.explanation);
  const setExplanation = useSession((s) => s.setExplanation);
  const [writing, setWriting] = useState(false);

  // 같은 결과에 대해 두 번 부르지 않는다. AI 호출은 돈이 든다
  const asked = useRef(false);

  useEffect(() => {
    if (!result || explanation || asked.current) return;
    asked.current = true;

    setWriting(true);
    explain({ results: result.results, summary: result.summary })
      .then((r) => setExplanation(r.explanation))
      .catch((e: ApiError) => {
        // ★ 설명문은 덤이다. 없어도 이 화면은 완전히 동작한다.
        //   AI 가 없거나(503) 실패해도(502) 화면에 오류를 띄우지 않는다.
        if (!e.isAiFallback) console.warn('설명 생성 실패:', e.code);
      })
      .finally(() => setWriting(false));

    // ★ cleanup 에서 취소 플래그를 세우지 않는다.
    //   개발 모드(StrictMode)는 effect 를 두 번 실행하는데, 첫 실행이
    //   cleanup 으로 무효화되면 그 요청의 finally 가 상태를 못 되돌려
    //   "쓰는 중" 스켈레톤이 영원히 남는다. 실제로 그 버그를 만났다.
    //   중복 호출은 위의 asked ref 가 이미 막고 있으므로 플래그가 필요 없다.
  }, [result, explanation, setExplanation]);

  if (!result) return <NoResult />;

  const {
    results,
    summary,
    facilities,
    facilitySummary,
    incomePct,
    medianIncomeYear,
    disclaimer,
  } = result;

  const available = facilities.filter((f) => f.status === 'ELIGIBLE');
  const needsInfo = facilities.filter((f) => f.status === 'NEEDS_INFO');
  const outOfScope = facilities.filter((f) => f.status === 'INELIGIBLE');

  return (
    <main className="mx-auto w-full max-w-[1000px] px-5 py-12 md:py-16">
      {/* ══ 시설 — 주인공 ══════════════════════════════════ */}
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[0.68rem] tracking-[0.14em] text-faint">
          연락할 수 있는 곳 · 규칙 엔진 산출 · 저장하지 않음
        </p>

        <h1 className="text-[clamp(1.9rem,4.5vw,2.6rem)] leading-tight font-bold tracking-[-0.03em]">
          {available.length > 0 ? (
            <>
              지금 연락하실 수 있는 곳이{' '}
              <span className="tabular text-brand">{available.length}곳</span>{' '}
              있습니다
            </>
          ) : needsInfo.length > 0 ? (
            <>어디 사시는지 알려주시면 갈 수 있는 곳을 찾아드립니다</>
          ) : (
            <>연락하실 수 있는 곳을 찾지 못했습니다</>
          )}
        </h1>

        {available.length > 0 && (
          <p className="text-[0.95rem] text-muted">
            {facilitySummary.reachableNow > 0 && (
              <>
                <strong className="font-semibold text-foreground">
                  {facilitySummary.reachableNow}곳은 지금 바로 전화
                </strong>
                하실 수 있습니다.{' '}
              </>
            )}
            이용료와 준비물을 함께 적어 두었습니다.
          </p>
        )}
      </header>

      {/* AI 설명문. 없어도 이 화면은 완전히 동작한다 */}
      {writing && !explanation && (
        <div className="mt-7 flex flex-col gap-2 rounded-[3px] border-l-[3px] border-border bg-surface px-5 py-4">
          <span className="font-mono text-[0.68rem] tracking-[0.14em] text-faint">
            읽기 쉬운 설명을 쓰는 중
          </span>
          <span className="h-3 w-[85%] animate-pulse rounded-[2px] bg-border-soft" />
          <span className="h-3 w-[60%] animate-pulse rounded-[2px] bg-border-soft" />
        </div>
      )}
      {explanation && (
        <p className="mt-7 rounded-[3px] border-l-[3px] border-brand bg-brand-weak px-5 py-4 text-[0.95rem] leading-relaxed text-muted">
          {explanation}
        </p>
      )}

      {available.length > 0 && (
        <FacilityGroup
          title="이용하실 수 있습니다"
          note="전화번호를 눌러 바로 연결하세요"
          noteTone="text-faint"
          matches={available}
          context={context}
        />
      )}

      {needsInfo.length > 0 && (
        <FacilityGroup
          title="조금만 더 알려주시면 확인됩니다"
          note="안 된다는 뜻이 아닙니다"
          noteTone="text-unknown"
          matches={needsInfo}
          context={context}
        />
      )}

      {outOfScope.length > 0 && (
        <OutOfScope matches={outOfScope} context={context} />
      )}

      {facilities.length === 0 && <NoFacilities />}

      {/* ══ 제도 — 부가 정보 ══════════════════════════════ */}
      {results.length > 0 && (
        <section className="mt-16 border-t-2 border-foreground pt-10">
          <p className="font-mono text-[0.68rem] tracking-[0.14em] text-faint">
            함께 신청할 수 있는 지원금
          </p>
          <p className="mt-2 max-w-[62ch] text-[0.92rem] text-muted">
            시설에 연락하실 때 아래 제도를 함께 물어보시면 좋습니다. 신청은
            주민센터나 복지로에서 하실 수 있습니다.
          </p>

          <div className="mt-7">
            <ResultSummary
              summary={summary}
              incomePct={incomePct}
              medianIncomeYear={medianIncomeYear}
            />
          </div>

          {PROGRAM_GROUPS.map((g) => {
            const rows = results.filter((r) => r.status === g.status);
            if (rows.length === 0) return null;
            return <ProgramGroup key={g.status} {...g} rows={rows} />;
          })}
        </section>
      )}

      {/* ══ 고지 ══════════════════════════════════════════ */}
      <p className="mt-12 flex flex-wrap items-baseline gap-x-4 gap-y-2 rounded-[3px] bg-surface px-5 py-4 text-[0.86rem] text-muted">
        <strong className="font-semibold text-foreground">{disclaimer}.</strong>
        <span>
          이 화면은 안내이며 공식 판정이 아닙니다. 시설의 운영시간과 이용 조건은
          바뀔 수 있으니 전화로 확인해 주세요.
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

// ── 시설 그룹 ───────────────────────────────────────────────

function FacilityGroup({
  title,
  note,
  noteTone,
  matches,
  context,
}: {
  title: string;
  note: string;
  noteTone: string;
  matches: FacilityMatch[];
  context: Parameters<typeof FacilityCard>[0]['context'];
}) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-foreground pt-10 pb-2">
        <h2 className="text-[1.02rem] font-semibold">{title}</h2>
        <span className="font-mono text-[0.8rem] text-faint">
          {matches.length}곳
        </span>
        <span className={`ml-auto text-[0.82rem] ${noteTone}`}>{note}</span>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {matches.map((m, i) => (
          <FacilityCard
            key={m.facility.id}
            match={m}
            context={context}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * 관할 밖 시설은 접어 둔다.
 *
 * 서울에서 자치구 시설을 판정하면 관할 밖이 24곳씩 나온다. 다 펼치면
 * 정작 갈 수 있는 곳이 묻힌다. 그래도 지우지는 않는다 —
 * "우리 동네 것만 나온 게 맞나" 를 확인할 수 있어야 하기 때문이다.
 */
function OutOfScope({
  matches,
  context,
}: {
  matches: FacilityMatch[];
  context: Parameters<typeof FacilityCard>[0]['context'];
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-2 text-left transition-colors hover:border-foreground"
      >
        <span className="text-[1.02rem] font-semibold text-muted">
          관할 지역이 아닌 곳
        </span>
        <span className="font-mono text-[0.8rem] text-faint">
          {matches.length}곳
        </span>
        <span className="ml-auto text-[0.84rem] text-brand">
          {open ? '접기' : '펼쳐 보기'}
        </span>
      </button>

      {open ? (
        <div className="mt-4 flex flex-col gap-3">
          {matches.map((m, i) => (
            <FacilityCard
              key={m.facility.id}
              match={m}
              context={context}
              index={i}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[0.86rem] text-faint">
          사시는 지역의 관할이 아니어서 이용하실 수 없는 곳입니다. 이사하셨거나
          지역을 잘못 입력하셨다면 값을 고쳐 다시 확인해 보세요.
        </p>
      )}
    </section>
  );
}

function NoFacilities() {
  return (
    <div className="mt-10 rounded-[3px] border border-border px-6 py-10 text-center">
      <p className="text-[1rem] font-semibold">
        연락하실 수 있는 곳을 찾지 못했습니다
      </p>
      <p className="mx-auto mt-2 max-w-[46ch] text-[0.9rem] text-muted">
        사시는 지역을 입력하시면 가까운 시설을 찾아드립니다. 급하시면 아래
        번호로 먼저 전화하셔도 됩니다.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <a
          href="tel:129"
          className="rounded-[3px] bg-brand px-5 py-2.5 text-[0.9rem] font-medium text-white transition-colors hover:bg-brand-strong"
        >
          129 보건복지상담센터
        </a>
        <Link
          href="/"
          className="rounded-[3px] border border-border px-5 py-2.5 text-[0.88rem] text-brand transition-colors hover:bg-brand-weak"
        >
          지역 입력하기
        </Link>
      </div>
    </div>
  );
}

// ── 제도 그룹 ───────────────────────────────────────────────

function ProgramGroup({
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
        <h3 className="text-[1.02rem] font-semibold">{title}</h3>
        <span className="font-mono text-[0.8rem] text-faint">
          {rows.length}건
        </span>
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
