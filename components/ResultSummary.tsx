/**
 * 결과 화면 상단 요약.
 *
 * ★ 합계·건수를 프론트에서 세지 않는다. 백엔드 `summary` 를 그대로 쓴다.
 *   같은 숫자를 두 곳에서 계산하면 언젠가 어긋난다.
 *
 * 비율 막대는 세 상태의 크기를 그대로 보여준다. "확인필요"가 결과의 절반이면
 * 절반으로 보여야 한다 — 아직 판단하지 못했다는 사실을 숨기지 않는다.
 */

import type { Summary } from '@/types';
import { comma, pct, won } from '@/lib/format';

export default function ResultSummary({
  summary,
  incomePct,
  medianIncomeYear,
}: {
  summary: Summary;
  incomePct: number | null;
  medianIncomeYear: number;
}) {
  const { eligibleCount, needsInfoCount, ineligibleCount, totalAnnualAmount } =
    summary;
  const total = eligibleCount + needsInfoCount + ineligibleCount;
  const share = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <section className="flex flex-col gap-2">
      <p className="font-mono text-[0.68rem] tracking-[0.14em] text-faint">
        확인된 조건 기준 · 연간 합계
      </p>

      <div className="flex flex-wrap items-end gap-x-5 gap-y-1">
        <span className="tabular text-[clamp(2.6rem,7vw,3.9rem)] leading-none font-semibold tracking-[-0.04em] text-brand">
          {comma(totalAnnualAmount)}
        </span>
        <span className="pb-1 text-[1.05rem] text-muted">원 / 년</span>
        <span className="pb-1 text-[1.05rem] text-faint">
          · 해당 {eligibleCount}건
        </span>
      </div>

      <div
        className="mt-4 flex h-[9px] overflow-hidden rounded-[2px] bg-surface"
        role="img"
        aria-label={`해당 ${eligibleCount}건, 확인필요 ${needsInfoCount}건, 미해당 ${ineligibleCount}건`}
      >
        <span className="block bg-pass" style={{ width: `${share(eligibleCount)}%` }} />
        <span className="block bg-unknown" style={{ width: `${share(needsInfoCount)}%` }} />
        <span className="block bg-fail" style={{ width: `${share(ineligibleCount)}%` }} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.84rem] text-muted">
        <Key color="bg-pass" label={`해당 ${eligibleCount}`} />
        <Key color="bg-unknown" label={`확인필요 ${needsInfoCount}`} />
        <Key color="bg-fail" label={`미해당 ${ineligibleCount}`} />
        {incomePct !== null && (
          <span className="text-faint">
            중위소득 대비{' '}
            <span className="tabular font-medium text-muted">{pct(incomePct)}%</span>
            <span className="text-faint"> ({medianIncomeYear}년 기준)</span>
          </span>
        )}
      </div>

      {/* 중복수급으로 빠진 제도가 있으면 반드시 밝힌다. 조용히 사라지면 안 된다 */}
      {summary.excludedByConflict && summary.excludedByConflict.length > 0 && (
        <p className="mt-3 rounded-[3px] border-l-[3px] border-unknown bg-unknown-weak px-4 py-3 text-[0.87rem] text-muted">
          동시에 받을 수 없는 제도가 있어{' '}
          <strong className="font-semibold text-unknown">
            {summary.excludedByConflict.length}건
          </strong>
          을 합계에서 제외했습니다. 남긴 조합이 금액이 더 큽니다.
        </p>
      )}

      {totalAnnualAmount === 0 && eligibleCount > 0 && (
        <p className="mt-3 text-[0.87rem] text-muted">
          해당하는 제도가 있지만 금액을 산정할 수 없는 형태(요금 감면·현물 지원)라
          합계가 {won(0)}으로 표시됩니다.
        </p>
      )}
    </section>
  );
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i aria-hidden className={`block size-[9px] rounded-[2px] ${color}`} />
      {label}
    </span>
  );
}
