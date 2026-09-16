'use client';

/**
 * 제도 하나를 한 줄로 그린다.
 *
 * ★ 카드가 아니라 괘선 행이다. 카드 격자는 "추천 서비스"의 형태이고,
 *   DUE 의 주장은 추천이 아니라 "이건 원래 당신 몫" 이다. 금액이 오른쪽에
 *   줄 맞춰 떨어지는 장부의 형태가 그 주장과 맞는다.
 *
 * ★ 여기서 금액을 계산하지 않는다. `estimatedAmount` 를 그대로 쓴다.
 *   급여 구조(월 23만 × 12)는 그 숫자의 근거를 적는 것일 뿐이다.
 */

import { useId, useState } from 'react';
import type { MatchResult } from '@/types';
import {
  benefitBasis,
  channelLabel,
  fieldListWithJosa,
  won,
} from '@/lib/format';
import { StatusPill } from '@/components/StatusPill';
import EvidenceTable from '@/components/EvidenceTable';

const ACCENT: Record<MatchResult['status'], string> = {
  ELIGIBLE: 'border-l-pass',
  NEEDS_INFO: 'border-l-unknown',
  // 미해당은 색을 빼서 뒤로 물린다. 지우지는 않는다 — 이유를 보여줘야 한다
  INELIGIBLE: 'border-l-border',
};

export default function ProgramRow({
  result,
  index = 0,
}: {
  result: MatchResult;
  index?: number;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const { program, status, estimatedAmount, missingFields, conditions } = result;
  const dimmed = status === 'INELIGIBLE';

  // ★ 미해당 제도에도 estimatedAmount 는 채워져 온다 — 그 제도의 연간 금액일 뿐
  //   합계에는 들어가지 않는다. 화면에 그대로 찍으면 "미해당인데 360만원"으로
  //   읽혀 오해를 산다. 받을 수 있을 때만 금액을 보여준다.
  const showAmount = !dimmed && estimatedAmount > 0;

  return (
    <article
      className={`row-rise border-b border-border-soft border-l-[3px] px-1 py-5 pl-4 transition-colors last:border-b-0 hover:bg-surface ${ACCENT[status]}`}
      style={{ '--i': index } as React.CSSProperties}
    >
      <div className="grid gap-x-6 gap-y-2 md:grid-cols-[minmax(0,1fr)_180px] md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3
              className={`text-[1.06rem] leading-snug font-semibold tracking-[-0.012em] ${
                dimmed ? 'font-medium text-faint' : ''
              }`}
            >
              {program.name}
            </h3>
            <StatusPill status={status} />
          </div>

          {program.summary && (
            <p className="mt-1.5 max-w-[56ch] text-[0.89rem] text-muted">
              {program.summary}
            </p>
          )}

          {/* 확인필요일 때만 — 무엇을 알려주면 되는지가 이 화면의 핵심이다 */}
          {status === 'NEEDS_INFO' && missingFields.length > 0 && (
            <p className="mt-2.5 text-[0.87rem] text-unknown">
              {fieldListWithJosa(missingFields, '을', '를')} 알려주시면 판단할 수
              있습니다.
            </p>
          )}

          <p className="mt-2 font-mono text-[0.78rem] text-faint">
            {[
              program.source.agency,
              program.apply.channel.map(channelLabel).join(' / '),
              program.apply.period,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <div className="md:text-right">
          <span
            className={`tabular text-[1.18rem] font-semibold tracking-[-0.02em] ${
              status === 'NEEDS_INFO'
                ? 'text-unknown'
                : dimmed
                  ? 'font-medium text-faint'
                  : ''
            }`}
          >
            {showAmount ? won(estimatedAmount) : '—'}
          </span>
          <span className="block font-mono text-[0.78rem] text-faint">
            {showAmount
              ? status === 'NEEDS_INFO'
                ? '해당 시 예상액'
                : benefitBasis(program.benefit)
              : dimmed
                ? '해당 없음'
                : (program.benefit.note ?? '금액 산정 불가')}
          </span>
        </div>
      </div>

      {/* 근거는 접어 둔다. 다 펼치면 결과의 윤곽이 안 보인다 */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="rounded-xl border border-border px-3 py-1.5 text-[0.84rem] text-brand transition-colors hover:bg-brand-weak"
        >
          {open ? '근거 접기' : `왜 이렇게 판정됐나요 (조건 ${conditions.length}개)`}
        </button>
        {program.source.url && (
          <a
            href={program.source.url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[0.84rem] text-brand underline underline-offset-4"
          >
            공식 안내 보기
          </a>
        )}
      </div>

      {open && (
        <div id={panelId} className="mt-4">
          <EvidenceTable conditions={conditions} />

          {/* 작성자가 표현하지 못한 요건을 숨기지 않는다. 심사에서 물어본다 */}
          {program.source.note && (
            <p className="mt-3 rounded-xl border border-dashed border-border px-4 py-3 text-[0.84rem] leading-relaxed text-muted">
              <span className="mb-1 block font-mono text-[0.78rem] tracking-[0.14em] text-faint">
                출처 · 개정 {program.source.revisedAt}
              </span>
              {program.source.note}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
