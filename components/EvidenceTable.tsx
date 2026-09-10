/**
 * 조건별 근거표 — 이 서비스의 승부처.
 *
 * 심사에서 가장 먼저 나오는 질문이 "AI가 그냥 그렇게 말한 것 아니냐" 다.
 * 이 표가 답이다. 조건 하나마다 입력값·기준·판정·사유가 남는다.
 *
 * ★ 여기서 다시 판정하지 않는다. `conditions[]` 를 그대로 그린다.
 * ★ UNKNOWN 행은 배경색을 달리해 FAIL 과 눈으로 구분한다.
 *   값이 없는 것과 기준을 못 넘은 것은 완전히 다른 사건이다.
 */

import type { ConditionResult } from '@/types';
import {
  actualLabel,
  criterion,
  displayStatus,
  fieldLabel,
} from '@/lib/format';
import { ConditionPill } from '@/components/StatusPill';

export default function EvidenceTable({
  conditions,
}: {
  conditions: ConditionResult[];
}) {
  if (conditions.length === 0) {
    return (
      <p className="px-5 py-4 text-[0.88rem] text-muted">
        이 제도에는 판정 조건이 등록되어 있지 않습니다.
      </p>
    );
  }

  // ★ 집계도 화면 기준으로 센다. 배제 조건은 뜻이 뒤집히므로
  //   엔진 상태로 세면 "통과인데 실패 1건" 같은 문장이 나온다
  const shown = conditions.map(displayStatus);
  const unknownCount = shown.filter((s) => s === 'UNKNOWN').length;
  const failCount = shown.filter((s) => s === 'FAIL').length;

  return (
    <div className="overflow-hidden rounded-[3px] border border-border">
      {/* 가로로 긴 표다. 페이지 전체가 옆으로 밀리지 않게 여기서만 스크롤한다 */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr>
              {['조건', '필드', '입력값', '기준', '판정', '사유'].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="border-b border-border bg-card px-5 py-3 text-left font-mono text-[0.68rem] font-medium tracking-[0.1em] whitespace-nowrap text-faint"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {conditions.map((c, i) => {
              const actual = actualLabel(c.actual, c.condition.field);
              const status = displayStatus(c);
              const isUnknown = status === 'UNKNOWN';
              const isExclusion = c.group === 'none';

              return (
                <tr
                  key={`${c.condition.field}-${c.condition.op}-${i}`}
                  className={isUnknown ? 'bg-unknown-tint' : undefined}
                >
                  <td className="border-b border-border-soft px-5 py-3 align-top text-[0.92rem]">
                    {c.condition.label || fieldLabel(c.condition.field)}
                  </td>
                  <td className="border-b border-border-soft px-5 py-3 align-top font-mono text-[0.8rem] whitespace-nowrap text-muted">
                    {c.condition.field}
                  </td>
                  <td
                    className={`tabular border-b border-border-soft px-5 py-3 align-top text-[0.86rem] whitespace-nowrap ${
                      actual.known ? 'font-medium' : 'font-normal text-unknown'
                    }`}
                  >
                    {actual.text}
                  </td>
                  <td className="tabular border-b border-border-soft px-5 py-3 align-top text-[0.86rem] whitespace-nowrap text-muted">
                    {/* ★ 배제 조건은 "이러면 안 된다" 는 뜻이다. 그냥 "= 재직"
                        으로 두면 "재직이어야 한다" 로 읽힌다 */}
                    {isExclusion && (
                      <span className="mr-1 text-faint">제외 조건 ·</span>
                    )}
                    {criterion(c.condition.op, c.condition.value, c.condition.field)}
                  </td>
                  <td className="w-px border-b border-border-soft px-5 py-3 align-top">
                    <ConditionPill status={status} />
                  </td>
                  <td className="border-b border-border-soft px-5 py-3 align-top text-[0.88rem] text-muted">
                    {c.reason}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 표 아래 한 줄 요약 — 표를 다 읽지 않아도 뜻이 전해져야 한다 */}
      <p className="border-t border-border bg-surface px-5 py-3 text-[0.87rem] text-muted">
        조건 {conditions.length}개 중{' '}
        {failCount > 0 && (
          <>
            <strong className="font-semibold text-fail">
              {failCount}개가 기준을 넘었고
            </strong>{' '}
          </>
        )}
        {unknownCount > 0 ? (
          <>
            <strong className="font-semibold text-unknown">
              {unknownCount}개는 아직 값이 없습니다.
            </strong>{' '}
            값이 없는 것은 미해당이 아닙니다 — 알려주시면 판단할 수 있습니다.
          </>
        ) : (
          <>확인된 값으로 전부 판정했습니다.</>
        )}
      </p>
    </div>
  );
}
