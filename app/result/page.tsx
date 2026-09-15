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
import type {
  FacilityMatch,
  FacilityType,
  MatchResult,
  MatchStatus,
  Sector,
} from '@/types';
import { ApiError, explain } from '@/lib/api';
import { useSession } from '@/lib/session';
import {
  bySector,
  facilityTypeLabel,
  hoursLabel,
  SECTOR_INFO,
  telHref,
} from '@/lib/facility';
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
  // 기관 종류로 걸러 보기. ★ 보여주기만 거른다 — 판정은 그대로다
  const [typeFilter, setTypeFilter] = useState<FacilityType | 'ALL'>('ALL');

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

  // 연락할 수 있는 곳(이용 가능 + 확인 필요)을 공공 · 민간으로 나눈다
  const reachableAll = [...available, ...needsInfo];
  // 결과에 실제로 있는 종류만 칩으로 만든다. 많은 순
  const typeCounts = new Map<FacilityType, number>();
  for (const m of reachableAll) {
    typeCounts.set(m.facility.type, (typeCounts.get(m.facility.type) ?? 0) + 1);
  }
  const typeOptions: Array<[FacilityType | 'ALL', string, number]> = [
    ['ALL', '전체', reachableAll.length],
    ...[...typeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t, n]): [FacilityType, string, number] => [t, facilityTypeLabel(t), n]),
  ];
  const reachable =
    typeFilter === 'ALL'
      ? reachableAll
      : reachableAll.filter((m) => m.facility.type === typeFilter);
  const split = bySector(reachable);

  return (
    <main className="mx-auto w-full max-w-[1100px] px-5 py-10 md:py-14">
      {/* ══ 시설 — 주인공 ══════════════════════════════════ */}
      <header className="flex flex-col gap-2">
        <p className="text-[0.8rem] font-medium text-warm-strong">
          2단계 · 연락할 수 있는 곳
        </p>

        <h1 className="font-serif text-[clamp(1.9rem,4.5vw,2.6rem)] leading-tight font-bold tracking-[-0.03em]">
          {available.length > 0 ? (
            <>
              지금 연락하실 수 있는 곳이{' '}
              <span className="tabular text-gradient">{available.length}곳</span>{' '}
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

        {reachableAll.length > 0 && (
          <div className="no-print mt-2 flex flex-wrap gap-2">
            {SECTORS.map((sector) => (
              <a
                key={sector}
                href={`#sector-${sector}`}
                className={`rounded-full px-3.5 py-1.5 text-[0.84rem] font-medium transition-colors ${
                  sector === 'PUBLIC'
                    ? 'bg-brand-weak text-brand hover:bg-brand/15'
                    : 'bg-warm-weak text-warm-strong hover:bg-warm/20'
                }`}
              >
                {SECTOR_INFO[sector].title}{' '}
                <span className="tabular">{split[sector].length}곳</span>
              </a>
            ))}
            {/* 목록이 길어 아래 지원금이 묻히지 않게 바로 가는 길을 둔다 */}
            {results.length > 0 && (
              <a
                href="#programs"
                className="rounded-full bg-surface px-3.5 py-1.5 text-[0.84rem] font-medium text-muted transition-colors hover:bg-border-soft"
              >
                지원금 <span className="tabular">{results.length}건</span>
              </a>
            )}
          </div>
        )}

        {typeOptions.length > 2 && (
          <div
            role="group"
            aria-label="기관 종류로 걸러 보기"
            className="no-print mt-1 flex flex-wrap items-center gap-2"
          >
            <span className="text-[0.8rem] text-faint">종류</span>
            {typeOptions.map(([t, label, n]) => (
              <button
                key={t}
                type="button"
                aria-pressed={typeFilter === t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-full px-3 py-1 text-[0.8rem] transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  typeFilter === t
                    ? 'bg-foreground text-white'
                    : 'bg-card text-muted ring-1 ring-border hover:bg-surface'
                }`}
              >
                {label} <span className="tabular opacity-80">{n}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* 위기 신호가 있으면 무엇보다 먼저 */}
      <UrgentLines matches={facilities.filter((f) => f.urgent)} />

      {/* AI 설명문. 없어도 이 화면은 완전히 동작한다 */}
      {writing && !explanation && (
        <div className="mt-7 flex flex-col gap-2 rounded-xl border-l-[3px] border-border bg-surface px-5 py-4">
          <span className="font-mono text-[0.68rem] tracking-[0.14em] text-faint">
            읽기 쉬운 설명을 쓰는 중
          </span>
          <span className="h-3 w-[85%] animate-pulse rounded-md bg-border-soft" />
          <span className="h-3 w-[60%] animate-pulse rounded-md bg-border-soft" />
        </div>
      )}
      {explanation && (
        <p className="mt-7 rounded-xl border-l-[3px] border-brand bg-brand-weak px-5 py-4 text-[0.95rem] leading-relaxed text-muted">
          {explanation}
        </p>
      )}

      {reachable.length > 0 &&
        SECTORS.map((sector, i) => (
          <SectorSection
            key={sector}
            sector={sector}
            first={i === 0}
            matches={split[sector]}
            filtered={typeFilter !== 'ALL'}
            context={context}
          />
        ))}

      {/* sector 가 빠진 시설 — 데이터 오류다. 숨기지 않되 공공·민간 어느 쪽에도 넣지 않는다 */}
      {split.unknown.length > 0 && (
        <FacilityGroup
          title="공공·민간 구분을 확인하지 못한 곳"
          note="전화로 운영 주체를 확인해 주세요"
          noteTone="text-faint"
          matches={split.unknown}
          context={context}
        />
      )}

      {outOfScope.length > 0 && (
        <OutOfScope matches={outOfScope} context={context} />
      )}

      {facilities.length === 0 && <NoFacilities />}

      {/* ══ 제도 — 부가 정보 ══════════════════════════════ */}
      {results.length > 0 && (
        <section
          id="programs"
          className="mt-20 scroll-mt-24 rounded-[2rem] border border-border-soft bg-surface/60 p-6 md:p-10"
        >
          <p className="text-[0.8rem] font-medium text-warm-strong">
            3단계 · 함께 신청할 수 있는 지원금
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
      <p className="mt-12 flex flex-wrap items-baseline gap-x-4 gap-y-2 rounded-xl bg-surface px-5 py-4 text-[0.86rem] text-muted">
        <strong className="font-semibold text-foreground">{disclaimer}.</strong>
        <span>
          이 화면은 안내이며 공식 판정이 아닙니다. 시설의 운영시간과 이용 조건은
          바뀔 수 있으니 전화로 확인해 주세요.
        </span>
      </p>

      <div className="no-print mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-brand px-6 py-3 text-[0.95rem] font-medium text-white transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-strong active:scale-[0.98]"
        >
          결과를 PDF로 저장
        </button>
        <Link
          href="/start"
          className="rounded-full border border-border px-6 py-3 text-[0.95rem] font-medium text-brand transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-weak"
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

// ── 지금 바로 이야기할 수 있는 곳 ─────────────────────────────

/**
 * 위기 신호(스스로를 해치고 싶은 마음 · 폭력 피해)가 있을 때 맨 위에 두는 상자.
 *
 * ★ 무엇을 띄울지는 백엔드 규칙이 정한다(시설 JSON 의 crisis). 여기서 번호를 고르지 않는다.
 * ★ 판정 상태 색(빨강·주황)을 쓰지 않는다. 겁주지 않고, 차분하게 번호만 크게 보인다.
 */
function UrgentLines({ matches }: { matches: FacilityMatch[] }) {
  if (matches.length === 0) return null;
  return (
    <section
      aria-label="지금 바로 이야기할 수 있는 곳"
      className="mt-8 rounded-3xl border border-brand/20 bg-brand-weak p-6 sm:p-7"
    >
      <h2 className="font-serif text-[1.3rem] font-bold tracking-[-0.02em]">
        지금 바로 이야기할 수 있는 곳이 있습니다
      </h2>
      <p className="mt-1.5 text-[0.95rem] text-muted">
        혼자 견디지 않으셔도 됩니다. 아래 번호로 전화하시면 상담원과 이야기할 수 있습니다.
      </p>
      <ul className="mt-5 flex flex-col gap-3">
        {matches.map((m) => {
          const f = m.facility;
          const hours = hoursLabel(f.contact);
          return (
            <li
              key={f.id}
              className="flex flex-col gap-3 rounded-2xl bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-[1.02rem] font-semibold">{f.name}</p>
                <p className={`text-[0.85rem] ${hours.known ? 'text-muted' : 'text-faint'}`}>
                  {hours.text}
                </p>
              </div>
              {f.contact.phone && (
                <a
                  href={telHref(f.contact.phone)}
                  className="rounded-full bg-brand px-6 py-3 text-center text-[1rem] font-semibold text-white transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-strong active:scale-[0.98]"
                >
                  <span className="tabular">{f.contact.phone}</span> 로 전화
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── 공공 · 민간 구역 ────────────────────────────────────────

const SECTORS: Sector[] = ['PUBLIC', 'PRIVATE'];

/**
 * 공공 또는 민간 한 구역. 안에서 다시 "이용 가능" / "확인 필요" 로 나눈다.
 *
 * ★ 구역이 비어도 지우지 않는다. "민간 기관은 없나?" 가 이용자가 가장 먼저
 *   하는 질문이다. 아직 모으지 못한 것이면 그렇다고 말한다.
 */
function SectorSection({
  sector,
  first,
  matches,
  filtered,
  context,
}: {
  sector: Sector;
  first: boolean;
  matches: FacilityMatch[];
  /** 종류 필터가 걸려 있다. 비었을 때 "아직 모으는 중" 이라고 말하면 틀린 말이 된다 */
  filtered: boolean;
  context: Parameters<typeof FacilityCard>[0]['context'];
}) {
  const info = SECTOR_INFO[sector];
  const isPublic = sector === 'PUBLIC';
  const ok = matches.filter((m) => m.status === 'ELIGIBLE');
  const ask = matches.filter((m) => m.status === 'NEEDS_INFO');

  return (
    <section id={`sector-${sector}`} className="scroll-mt-6">
      {/* 구분선 — 두 번째 구역부터 */}
      {first ? (
        <div className="mt-10" />
      ) : (
        <div
          role="separator"
          aria-label={`여기부터 ${info.title}`}
          className="my-14 flex items-center gap-4"
        >
          <span className="sector-rule flex-1" />
          <span className="rounded-full border border-warm/30 bg-warm-weak px-4 py-1.5 text-[0.8rem] font-semibold text-warm-strong">
            여기부터 {info.title}
          </span>
          <span className="sector-rule flex-1" />
        </div>
      )}

      <div
        className={`flex flex-col gap-2 rounded-3xl border p-6 sm:flex-row sm:items-center sm:gap-5 ${
          isPublic
            ? 'border-brand/15 bg-gradient-to-r from-brand-weak to-white'
            : 'border-warm/20 bg-gradient-to-r from-warm-weak to-white'
        }`}
      >
        <span
          className={`w-fit shrink-0 rounded-full px-3.5 py-1 text-[0.8rem] font-semibold text-white ${
            isPublic ? 'bg-brand' : 'bg-warm-strong'
          }`}
        >
          {info.label}
        </span>
        <div className="flex flex-col">
          <h2 className="text-[1.2rem] font-bold tracking-[-0.025em]">
            {info.title}{' '}
            <span className="tabular text-[1rem] font-medium text-faint">
              {matches.length}곳
            </span>
          </h2>
          <p className="text-[0.88rem] text-muted">{info.note}</p>
        </div>
      </div>

      {matches.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border px-5 py-5 text-[0.9rem] text-muted">
          {filtered
            ? '고르신 종류의 기관은 이 구역에 없습니다.'
            : isPublic
              ? '사시는 지역에서 연락하실 수 있는 공공 기관을 아직 찾지 못했습니다.'
              : '사시는 지역의 민간 기관 정보는 아직 모으는 중입니다.'}{' '}
          <span className="text-faint">
            위의 기관에 전화하시면 가까운 곳을 함께 안내받으실 수 있습니다.
          </span>
        </p>
      ) : (
        <>
          {ok.length > 0 && (
            <FacilityGroup
              title="이용하실 수 있습니다"
              note="전화번호를 눌러 바로 연결하세요"
              noteTone="text-faint"
              matches={ok}
              context={context}
            />
          )}
          {ask.length > 0 && (
            <FacilityGroup
              title="조금만 더 알려주시면 확인됩니다"
              note="안 된다는 뜻이 아닙니다"
              noteTone="text-unknown"
              matches={ask}
              context={context}
            />
          )}
        </>
      )}
    </section>
  );
}

// ── 시설 그룹 ───────────────────────────────────────────────

/** 한 그룹에서 처음 보여줄 수와 "더 보기" 한 번에 늘리는 수 */
const FIRST_PAGE = 5;
const PAGE_STEP = 10;

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
  // ★ 전국 데이터에서는 한 그룹에 60곳이 넘게 나온다. 한꺼번에 펼치면 모바일에서
  //   화면 70장 분량이 되어 아래의 지원금은 아무도 못 본다. 처음엔 5곳만 보인다
  const [shown, setShown] = useState(FIRST_PAGE);
  const visible = matches.slice(0, shown);
  const rest = matches.length - visible.length;

  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pt-8 pb-2">
        <h3 className="text-[1.02rem] font-semibold">{title}</h3>
        <span className="font-mono text-[0.8rem] text-faint">
          {matches.length}곳
        </span>
        <span className={`ml-auto text-[0.82rem] ${noteTone}`}>{note}</span>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {visible.map((m, i) => (
          <FacilityCard
            key={m.facility.id}
            match={m}
            context={context}
            index={i % PAGE_STEP}
          />
        ))}
      </div>

      {rest > 0 && (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE_STEP)}
          className="no-print mt-4 w-full rounded-full border border-border bg-card py-3 text-[0.92rem] font-medium text-brand transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-weak"
        >
          {Math.min(PAGE_STEP, rest)}곳 더 보기{' '}
          <span className="font-normal text-faint">(남은 {rest}곳)</span>
        </button>
      )}
    </section>
  );
}

/**
 * 관할 밖 시설은 접어 둔다.
 *
 * 전국 데이터에서는 관할 밖이 2천 곳이 넘는다. 다 그리면 휴대폰이 멈춘다
 * (2,185장 · 2.5초를 실제로 쟀다). 그래도 지우지는 않는다 —
 * "우리 동네 것만 나온 게 맞나" 를 확인할 수 있어야 하기 때문이다. 펼쳐도 20곳까지만 그린다.
 */
const OUT_OF_SCOPE_LIMIT = 20;

function OutOfScope({
  matches,
  context,
}: {
  matches: FacilityMatch[];
  context: Parameters<typeof FacilityCard>[0]['context'];
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="no-print mt-10">
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
        <>
          <div className="mt-4 flex flex-col gap-3">
            {matches.slice(0, OUT_OF_SCOPE_LIMIT).map((m, i) => (
              <FacilityCard
                key={m.facility.id}
                match={m}
                context={context}
                index={i}
              />
            ))}
          </div>
          {matches.length > OUT_OF_SCOPE_LIMIT && (
            <p className="mt-3 text-[0.86rem] text-faint">
              그 외 {matches.length - OUT_OF_SCOPE_LIMIT}곳은 다른 지역의 기관이라 목록에서
              생략했습니다.
            </p>
          )}
        </>
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
    <div className="mt-10 rounded-xl border border-border px-6 py-10 text-center">
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
          className="rounded-full bg-brand px-5 py-2.5 text-[0.9rem] font-medium text-white transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-strong active:scale-[0.98]"
        >
          129 보건복지상담센터
        </a>
        <Link
          href="/start"
          className="rounded-xl border border-border px-5 py-2.5 text-[0.88rem] text-brand transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-weak"
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
        href="/start"
        className="mt-2 self-start rounded-full bg-brand px-6 py-3 text-[0.95rem] font-medium text-white transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-strong active:scale-[0.98]"
      >
        처음부터 다시 하기
      </Link>
    </main>
  );
}
