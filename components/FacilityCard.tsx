'use client';

/**
 * 시설 하나. 이 화면의 결말이다.
 *
 * 제도 행(ProgramRow)은 "읽는 것" 이라 괘선으로 그렸지만, 시설은 "누르는 것" 이다.
 * 전화 버튼이 화면에서 가장 눈에 띄어야 하고, 각 시설이 독립된 행동 단위로
 * 읽혀야 한다. 그래서 여기서만 카드를 쓴다.
 *
 * ★ 관할 밖 시설은 전화번호를 감춘다. 못 쓰는 번호를 보여주면 헛걸음을 부른다.
 * ★ 운영시간이 없으면 지어내지 않고 "전화로 확인" 이라고 말한다.
 * ★ 문의 문구는 사용자 기기에서만 나간다. 서버로 보내지 않는다 (설계 원칙 2).
 */

import { useId, useState } from 'react';
import type { FacilityMatch, UserContext } from '@/types';
import {
  addressOf,
  buildInquiry,
  checklistOf,
  facilityTypeLabel,
  hoursLabel,
  mailtoHref,
  mapHref,
  SECTOR_INFO,
  smsHref,
  telHref,
} from '@/lib/facility';
import { fieldListWithJosa } from '@/lib/format';
import { Pill, StatusPill } from '@/components/StatusPill';
import EvidenceTable from '@/components/EvidenceTable';
import ReadAloud from '@/components/ReadAloud';

export default function FacilityCard({
  match,
  context,
  index = 0,
}: {
  match: FacilityMatch;
  context: UserContext;
  index?: number;
}) {
  const [openPanel, setOpenPanel] = useState<'none' | 'why' | 'prep'>('none');
  const panelId = useId();

  const { facility: f, status, conditions, missingFields } = match;
  const outOfScope = status === 'INELIGIBLE';
  const address = addressOf(f);
  const map = mapHref(f);
  const hours = hoursLabel(f.contact);
  const inquiry = buildInquiry(f, context, missingFields);

  // ★ 관할 밖이면 연락 수단을 내리고 이유만 남긴다
  const canContact = !outOfScope;
  const reason = conditions[0]?.reason ?? '';

  const toggle = (p: 'why' | 'prep') =>
    setOpenPanel((cur) => (cur === p ? 'none' : p));

  return (
    <article
      className={`row-rise bezel ${outOfScope ? 'opacity-80' : ''}`}
      style={{ '--i': index } as React.CSSProperties}
    >
      <div className="bezel-core overflow-hidden">
      <div className={`p-5 sm:p-6 ${outOfScope ? 'opacity-70' : ''}`}>
        {/* ── 머리 ── */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <span className="font-mono text-[0.78rem] tracking-[0.12em] text-faint">
            {facilityTypeLabel(f.type)}
          </span>
          {(f.sector === 'PUBLIC' || f.sector === 'PRIVATE') && (
            <Pill
              tone={f.sector === 'PUBLIC' ? 'public' : 'private'}
              label={SECTOR_INFO[f.sector].label}
            />
          )}
          <StatusPill status={status} />
          {f.contact.always && !outOfScope && (
            <Pill tone="pass" label="24시간" />
          )}
          {f.fee && !outOfScope && <Pill label={f.fee} />}
        </div>

        <h3 className="mt-2 text-[1.22rem] leading-snug font-semibold tracking-[-0.02em]">
          {f.name}
        </h3>

        {f.summary && (
          <p className="mt-1.5 max-w-[58ch] text-[0.92rem] text-muted">
            {f.summary}
          </p>
        )}

        {/* ── 연락 ── 가장 크게 */}
        {canContact ? (
          <div className="mt-5 flex flex-col gap-3">
            {f.contact.phone && (
              <a
                href={telHref(f.contact.phone)}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-brand px-6 py-4 text-[1.05rem] font-semibold text-white transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-strong active:scale-[0.98] sm:w-auto"
              >
                <PhoneIcon />
                <span className="tabular">{f.contact.phone}</span>
                <span className="font-normal opacity-90">로 전화</span>
              </a>
            )}

            <div className="flex flex-wrap gap-2">
              {map && (
                <a
                  href={map}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-xl border border-border px-3.5 py-2 text-[0.86rem] text-brand transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-weak"
                >
                  지도로 보기
                </a>
              )}
              {f.contact.applyUrl && (
                <a
                  href={f.contact.applyUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-xl border border-brand px-3.5 py-2 text-[0.86rem] font-medium text-brand transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-weak"
                >
                  온라인 신청
                </a>
              )}
              {f.contact.website && (
                <a
                  href={f.contact.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-xl border border-border px-3.5 py-2 text-[0.86rem] text-brand transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-weak"
                >
                  홈페이지
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-xl border-l-[3px] border-border bg-surface px-4 py-3 text-[0.88rem] text-muted">
            {reason || '관할 지역이 아닙니다.'}
            {f.coverage.note && (
              <span className="mt-1 block text-faint">{f.coverage.note}</span>
            )}
          </p>
        )}

        {/* ── 기본 정보 ── */}
        {canContact && (
          <dl className="mt-5 flex flex-col gap-2 border-t border-border-soft pt-4 text-[0.88rem]">
            {address && (
              <Row label="주소">
                <span>{address}</span>
              </Row>
            )}
            {f.operator && (
              <Row label="운영">
                <span>{f.operator}</span>
              </Row>
            )}
            <Row label="운영시간">
              <span className={hours.known ? '' : 'text-faint'}>
                {hours.text}
              </span>
            </Row>
            {f.services && f.services.length > 0 && (
              <Row label="하는 일">
                <span className="flex flex-wrap gap-1.5">
                  {f.services.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-surface px-2.5 py-0.5 text-[0.8rem] text-muted"
                    >
                      {s}
                    </span>
                  ))}
                </span>
              </Row>
            )}
          </dl>
        )}

        {/* ── 확인필요: 무엇을 알려주면 되는지 ── */}
        {status === 'NEEDS_INFO' && missingFields.length > 0 && (
          <p className="mt-4 rounded-xl border-l-[3px] border-unknown bg-unknown-weak px-4 py-3 text-[0.89rem] text-muted">
            <strong className="font-semibold text-unknown">
              {fieldListWithJosa(missingFields, '을', '를')} 알려주시면
            </strong>{' '}
            이용할 수 있는지 확실히 알려드릴 수 있습니다. 지금도 전화해서 직접
            물어보실 수 있습니다.
          </p>
        )}

        {/* ── 더 보기 ── */}
        <div className="no-print mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toggle('why')}
            aria-expanded={openPanel === 'why'}
            aria-controls={panelId}
            className="rounded-xl border border-border px-3 py-1.5 text-[0.84rem] text-brand transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-weak"
          >
            {openPanel === 'why' ? '근거 접기' : '왜 이렇게 판정됐나요'}
          </button>
          {canContact && (
            <button
              type="button"
              onClick={() => toggle('prep')}
              aria-expanded={openPanel === 'prep'}
              aria-controls={panelId}
              className="rounded-xl border border-border px-3 py-1.5 text-[0.84rem] text-brand transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-weak"
            >
              {openPanel === 'prep' ? '접기' : '전화하기 전에 볼 것'}
            </button>
          )}
        </div>
      </div>

      {(openPanel !== 'none') && (
        <div id={panelId} className="border-t border-border-soft bg-surface/60 p-5 sm:p-6">
          {openPanel === 'why' && (
            <>
              <EvidenceTable conditions={conditions} />
              {f.source.note && (
                <p className="mt-3 rounded-xl border border-dashed border-border px-4 py-3 text-[0.83rem] leading-relaxed text-muted">
                  <span className="mb-1 block font-mono text-[0.78rem] tracking-[0.14em] text-faint">
                    출처 {f.source.agency ?? ''} · 기준 {f.source.revisedAt}
                  </span>
                  {f.source.note}
                </p>
              )}
            </>
          )}
          {openPanel === 'prep' && <PrepPanel match={match} inquiry={inquiry} />}
        </div>
      )}
      </div>
    </article>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[88px_1fr] sm:gap-4">
      <dt className="font-mono text-[0.78rem] tracking-[0.1em] text-faint sm:pt-[0.15rem]">
        {label}
      </dt>
      <dd className="m-0 text-muted">{children}</dd>
    </div>
  );
}

/**
 * 전화하기 전에 볼 것 — 준비물과 할 말.
 *
 * 처음 전화하는 사람이 가장 막막해하는 지점이다. 통화 한 번으로 끝나게
 * 만드는 것이 목적이다 — 다시 전화하게 만들지 않는다.
 */
function PrepPanel({
  match,
  inquiry,
}: {
  match: FacilityMatch;
  inquiry: { subject: string; body: string };
}) {
  const [copied, setCopied] = useState(false);
  const { facility: f } = match;
  const checklist = checklistOf(f);

  async function copy() {
    try {
      await navigator.clipboard.writeText(inquiry.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드를 못 쓰는 브라우저·비보안 컨텍스트가 있다.
      // 아래 상자의 글이 그대로 보이므로 직접 선택해 복사할 수 있다
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 준비물 */}
      <section>
        <h4 className="text-[0.95rem] font-semibold">챙겨가실 것</h4>
        <ul className="mt-2 flex flex-col gap-1.5">
          {checklist.items.map((item) => (
            <li
              key={item}
              className="relative pl-5 text-[0.89rem] text-muted before:absolute before:top-[0.55em] before:left-0 before:block before:size-[6px] before:rounded-[1px] before:border before:border-border"
            >
              {item}
            </li>
          ))}
        </ul>
        {!checklist.fromData && (
          <p className="mt-2 text-[0.82rem] text-faint">
            이 시설의 정확한 준비물은 확인되지 않았습니다. 어디서나 필요한 것만
            적었으니 전화로 함께 확인해 주세요.
          </p>
        )}
      </section>

      {/* 할 말 */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="text-[0.95rem] font-semibold">이렇게 말하시면 됩니다</h4>
          <span className="text-[0.8rem] text-faint">
            그대로 읽으셔도 됩니다
          </span>
        </div>

        <pre className="mt-2 overflow-x-auto rounded-xl border border-border bg-card px-4 py-3.5 font-sans text-[0.89rem] leading-relaxed whitespace-pre-wrap text-foreground">
          {inquiry.body}
        </pre>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copy}
            className="rounded-xl border border-border px-3.5 py-2 text-[0.86rem] text-brand transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-weak"
          >
            {copied ? '복사했습니다' : '문구 복사'}
          </button>
          <ReadAloud
            text={inquiry.body}
            className="rounded-xl border border-border px-3.5 py-2 text-[0.86rem] text-brand transition-colors hover:bg-brand-weak"
          />
          {f.contact.phone && (
            <a
              href={smsHref(f.contact.phone, inquiry.body)}
              className="rounded-xl border border-border px-3.5 py-2 text-[0.86rem] text-brand transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-weak"
            >
              문자로 보내기
            </a>
          )}
          {f.contact.email && (
            <a
              href={mailtoHref(f.contact.email, inquiry.subject, inquiry.body)}
              className="rounded-xl border border-border px-3.5 py-2 text-[0.86rem] text-brand transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-weak"
            >
              메일로 보내기
            </a>
          )}
        </div>

        {/* ★ 발표에서 짚을 지점 */}
        <p className="mt-3 text-[0.82rem] leading-relaxed text-faint">
          이 문구는 <strong className="text-muted">이 기기에서만</strong>{' '}
          만들어졌습니다. 보내기를 누르면 회원님의 문자·메일 앱이 열리고, DUE
          서버는 내용을 보지도 저장하지도 않습니다.
        </p>
      </section>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
