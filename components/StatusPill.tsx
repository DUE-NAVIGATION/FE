/**
 * 판정 상태 표식.
 *
 * 제도 단위(ELIGIBLE/NEEDS_INFO/INELIGIBLE)와 조건 단위(PASS/UNKNOWN/FAIL)를
 * 한 컴포넌트로 그린다. 두 축이 같은 색 규칙을 쓰기 때문이다.
 *
 * ★ 색은 토큰에서만 가져온다. 초록·주황·붉은색은 장식이 아니라 기호다.
 * ★ 색만으로 뜻을 전하지 않는다 — 글자를 항상 함께 둔다 (색각 이상 고려).
 */

import type { ConditionStatus, MatchStatus } from '@/types';

type Tone = 'pass' | 'unknown' | 'fail' | 'flat' | 'public' | 'private';

const TONE: Record<Tone, string> = {
  pass: 'bg-pass-weak text-pass',
  unknown: 'bg-unknown-weak text-unknown',
  fail: 'bg-fail-weak text-fail',
  flat: 'bg-surface text-muted',
  // 공공 · 민간은 판정 상태가 아니다. 그래서 상태색이 아닌 남색·살구색을 쓴다
  public: 'bg-brand-weak text-brand',
  private: 'bg-warm-weak text-warm-strong',
};

/** 제도 단위 상태 → 화면 문구. "확인필요"는 "안 됨"이 아니다 */
const MATCH: Record<MatchStatus, { tone: Tone; label: string }> = {
  ELIGIBLE: { tone: 'pass', label: '해당' },
  NEEDS_INFO: { tone: 'unknown', label: '확인필요' },
  INELIGIBLE: { tone: 'fail', label: '미해당' },
};

/** 조건 단위 상태. UNKNOWN 은 입력값이 없다는 뜻이지 탈락이 아니다 */
const CONDITION: Record<ConditionStatus, { tone: Tone; label: string }> = {
  PASS: { tone: 'pass', label: 'PASS' },
  UNKNOWN: { tone: 'unknown', label: 'UNKNOWN' },
  FAIL: { tone: 'fail', label: 'FAIL' },
};

export function StatusPill({
  status,
  className = '',
}: {
  status: MatchStatus;
  className?: string;
}) {
  const { tone, label } = MATCH[status];
  return <Pill tone={tone} label={label} className={className} />;
}

export function ConditionPill({
  status,
  className = '',
}: {
  status: ConditionStatus;
  className?: string;
}) {
  const { tone, label } = CONDITION[status];
  return <Pill tone={tone} label={label} mono className={className} />;
}

/** 상태가 아닌 보조 표식 (확신도, "규칙 엔진 정상" 등) */
export function Pill({
  tone = 'flat',
  label,
  mono = false,
  className = '',
}: {
  tone?: Tone;
  label: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 pb-[0.2rem] pt-[0.16rem] text-[0.7rem] font-semibold ${
        mono ? 'font-mono tracking-[0.02em]' : ''
      } ${TONE[tone]} ${className}`}
    >
      <span aria-hidden className="block size-1.5 shrink-0 rounded-full bg-current" />
      {label}
    </span>
  );
}
