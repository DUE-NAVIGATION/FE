'use client';

/**
 * 상황 입력 (`/start`). 첫 화면(`/`)의 "내 상황 입력하기" 가 여기로 온다.
 *
 * 두 갈래가 있다.
 *   AI 있음 : 자유롭게 적은 문장을 백엔드가 판정 입력값으로 옮긴다
 *   AI 없음 : 직접 입력 폼으로 바로 간다
 *
 * ★ 어느 쪽이든 판정은 규칙 엔진이 한다. AI 는 말을 값으로 옮길 뿐이다.
 * ★ 여기서 저장하지 않는다. 상태는 메모리(zustand)에만 있고, 새로고침하면 사라진다.
 * ★ AI 가 실패해도 막다른 길이 아니다 — 항상 직접 입력으로 갈 수 있다.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, evaluate, extract, getHealth, getRegions } from '@/lib/api';
import { useSession } from '@/lib/session';
import { fieldLabel } from '@/lib/format';
import ManualForm from '@/components/ManualForm';
import { Pill } from '@/components/StatusPill';
import type { SanitizeKind } from '@/types';

const MAX_TEXT = 2000;

/** 가려진 민감정보 종류를 사람 말로 */
const SANITIZE_LABEL: Record<SanitizeKind, string> = {
  RESIDENT_ID: '주민등록번호',
  CARD_NUMBER: '카드번호',
  ACCOUNT_NUMBER: '계좌번호',
  PHONE: '전화번호',
  EMAIL: '이메일',
};

type Backend =
  | { kind: 'checking' }
  // 무료 서버(Render)가 잠에서 깨는 중. 첫 요청에 1분 가까이 걸린다
  | { kind: 'waking' }
  | {
      kind: 'up';
      aiEnabled: boolean;
      programCount: number;
      facilityCount: number;
      year: number;
    }
  | { kind: 'down'; message: string };

export default function Home() {
  const router = useRouter();
  const { context, extraction, setContext, setExtraction, setResult, reset } =
    useSession();

  const [backend, setBackend] = useState<Backend>({ kind: 'checking' });
  const [text, setText] = useState('');
  const [manual, setManual] = useState(false);
  // 시도 → 시군구 선택 목록. 못 받으면 비워 두고 직접 입력으로 간다
  const [districts, setDistricts] = useState<Record<string, string[]>>();
  const [busy, setBusy] = useState<'extract' | 'evaluate' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 서버 상태로 입력 방식을 정한다. AI 가 없으면 처음부터 직접 입력을 연다.
  //
  // ★ 배포 서버는 무료 플랜이라 15분 쉬면 잠든다. 깨는 데 1분 가까이 걸리는데,
  //   한 번 실패했다고 "백엔드 없음" 으로 굳히면 심사위원은 고장으로 본다.
  //   그래서 몇 번 더 두드린다 (약 1분). 그래도 안 되면 그때 없다고 말한다.
  useEffect(() => {
    let alive = true;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = () => {
      getHealth()
        .then((h) => {
          if (!alive) return;
          setBackend({
            kind: 'up',
            aiEnabled: h.aiEnabled,
            programCount: h.programCount,
            facilityCount: h.facilityCount,
            year: h.medianIncomeYear,
          });
          if (!h.aiEnabled) setManual(true);
          getRegions()
            .then((r) => {
              if (!alive) return;
              setDistricts(Object.fromEntries(r.regions.map((g) => [g.sido, g.sigungu])));
            })
            .catch(() => {
              // 목록은 덤이다. 없으면 시군구를 직접 입력한다
            });
        })
        .catch((e: ApiError) => {
          if (!alive) return;
          setManual(true);
          tries += 1;
          if (tries < 6) {
            setBackend({ kind: 'waking' });
            timer = setTimeout(check, 3000);
          } else {
            setBackend({ kind: 'down', message: e.message });
          }
        });
    };
    check();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  async function runExtract() {
    setError(null);
    setBusy('extract');
    try {
      const out = await extract(text.trim());
      setExtraction(out);
      setContext(out.extracted);
      setManual(true); // 옮긴 값을 눈으로 확인하고 고칠 수 있게 폼을 연다
    } catch (e) {
      const err = e as ApiError;
      setError(
        err.isAiFallback
          ? `${err.message} 아래에서 직접 입력하시면 판정은 그대로 진행됩니다.`
          : err.message,
      );
      setManual(true);
    } finally {
      setBusy(null);
    }
  }

  async function runEvaluate() {
    setError(null);
    setBusy('evaluate');
    try {
      const out = await evaluate(context);
      setResult(out);
      router.push('/result');
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(null);
    }
  }

  const aiUsable = backend.kind === 'up' && backend.aiEnabled;
  const hasAnyInput = Object.keys(context).length > 0;

  return (
    <main className="mx-auto w-full max-w-[1100px] px-5 py-10 md:py-14">
      <header className="flex flex-col gap-3">
        <p className="text-[0.8rem] font-medium text-warm-strong">
          1단계 · 상황 알려주기
        </p>
        <h1 className="font-serif text-[clamp(1.9rem,4.6vw,2.7rem)] leading-tight font-bold tracking-[-0.04em]">
          지금 어떤 상황이신지
          <br />
          <span className="text-gradient">편하게 알려주세요</span>
        </h1>
        <p className="max-w-[40ch] text-[1.02rem] leading-relaxed text-muted">
          아는 것만 채우셔도 됩니다. 사시는 곳을 알려주시면 갈 수 있는 기관을
          찾아드립니다.
        </p>
        <ServerLine backend={backend} />
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.12fr] lg:gap-14">
        {/* 왼쪽 — 약속. 이 화면에서 무엇이 지켜지는지 */}
        <aside className="bezel-core self-start px-7 py-6 ring-1 ring-[rgba(120,80,45,0.08)]">
          <h2 className="mb-2.5 text-[0.95rem] font-semibold text-brand">
            이 화면에서 지켜지는 것
          </h2>
          <ul className="flex flex-col gap-1.5">
            {[
              '입력한 내용을 저장하지 않습니다. 새로고침하면 사라집니다.',
              '이름·주소·주민등록번호는 AI로 보내지 않습니다.',
              '로그인이 없고, 계정을 만들 필요도 없습니다.',
              '판정은 AI가 아니라 규칙 엔진이 합니다.',
            ].map((s) => (
              <li
                key={s}
                className="relative pl-4 text-[0.87rem] leading-relaxed text-muted before:absolute before:top-[0.62em] before:left-0 before:block before:size-[5px] before:rounded-full before:bg-warm"
              >
                {s}
              </li>
            ))}
          </ul>
        </aside>

        {/* 오른쪽 — 입력 */}
        <div className="flex flex-col gap-4">
          {aiUsable && (
            <>
              <label className="flex flex-col gap-2">
                <span className="text-[0.88rem] font-medium">지금 상황</span>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
                  placeholder="예) 아이 혼자 키우는데 지난달에 일이 끊겼어요. 아이는 일곱 살이고 월세 45만원짜리 집에 살아요."
                  className="min-h-[168px] w-full resize-y rounded-xl border border-border bg-card px-4 py-3.5 text-[0.98rem] leading-relaxed text-foreground placeholder:text-faint focus-visible:border-brand focus-visible:outline-offset-0"
                />
                <span className="text-[0.8rem] text-faint">
                  말하듯 적으셔도 됩니다. 모르는 건 비워두셔도 됩니다 — 모른다고
                  탈락시키지 않습니다. ({text.length}/{MAX_TEXT})
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={text.trim() === '' || busy !== null}
                  onClick={runExtract}
                  className="rounded-full bg-brand px-6 py-3 text-[0.95rem] font-medium text-white transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy === 'extract' ? '옮기는 중…' : '내 상황 옮기기'}
                </button>
                {!manual && (
                  <button
                    type="button"
                    onClick={() => setManual(true)}
                    className="rounded-full border border-border px-6 py-3 text-[0.95rem] font-medium text-brand transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-weak"
                  >
                    직접 입력할래요
                  </button>
                )}
              </div>
            </>
          )}

          {/* AI 가 가린 것을 밝힌다. 가려진 값 자체는 응답에 없다 */}
          {extraction?.sanitized && Object.keys(extraction.sanitized).length > 0 && (
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl bg-surface px-4 py-3 text-[0.86rem] text-muted">
              <strong className="font-semibold text-foreground">
                민감한 정보를 지우고 보냈습니다.
              </strong>
              <span className="tabular text-[0.8rem]">
                {Object.entries(extraction.sanitized)
                  .map(([k, n]) => `${SANITIZE_LABEL[k as SanitizeKind] ?? k} ${n}`)
                  .join(' · ')}
              </span>
              <span className="text-faint">가린 값은 서버에도 남지 않습니다.</span>
            </p>
          )}

          {/* AI 되묻기 — 무엇을 알려주면 정확해지는지 */}
          {extraction && extraction.followUpQuestions.length > 0 && (
            <div className="border-l-[3px] border-unknown pl-4">
              <h3 className="mb-1.5 text-[0.9rem] font-semibold text-unknown">
                이것만 더 알려주시면 훨씬 정확해집니다
              </h3>
              <ul className="flex flex-col gap-1">
                {extraction.followUpQuestions.map((q) => (
                  <li key={q} className="text-[0.93rem] text-muted">
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p className="rounded-xl border-l-[3px] border-fail bg-fail-weak px-4 py-3 text-[0.9rem] text-muted">
              {error}
            </p>
          )}

          {manual && (
            <section className="bezel-core flex flex-col gap-5 p-6 ring-1 ring-[rgba(120,80,45,0.08)] sm:p-8">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-[1.05rem] font-semibold">
                  {extraction ? '이렇게 이해했습니다' : '직접 입력'}
                </h2>
                <span className="text-[0.86rem] text-muted">
                  {extraction
                    ? '틀린 게 있으면 고치세요. 비워두셔도 됩니다.'
                    : '아는 것만 채우시면 됩니다. 빈 칸은 "모름"으로 판정됩니다.'}
                </span>
              </div>

              <ManualForm value={context} onChange={setContext} districts={districts} />

              {hasAnyInput && (
                <p className="font-mono text-[0.78rem] text-faint">
                  채워진 항목: {Object.keys(context).map(fieldLabel).join(' · ')}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={busy !== null || backend.kind !== 'up'}
                  onClick={runEvaluate}
                  className="rounded-full bg-brand px-6 py-3 text-[0.95rem] font-medium text-white transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-brand-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy === 'evaluate' ? '판정 중…' : '받을 수 있는 것 찾기'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setText('');
                    setError(null);
                  }}
                  className="text-[0.88rem] text-muted underline underline-offset-4"
                >
                  전부 지우기
                </button>
              </div>
              <p className="text-[0.82rem] text-faint">
                비워둔 채로 진행해도 됩니다. 비면 미해당이 아니라 확인필요가 됩니다.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * 서버 상태 한 줄.
 *
 * 데모 중에 "왜 안 되지" 를 5초 안에 알아채기 위한 장치다.
 * AI 가 없다는 사실도 숨기지 않는다 — 없어도 판정은 된다.
 */
function ServerLine({ backend }: { backend: Backend }) {
  if (backend.kind === 'checking') {
    return (
      <p className="mt-1 text-[0.84rem] text-faint">백엔드 연결 확인 중…</p>
    );
  }

  if (backend.kind === 'waking') {
    return (
      <p className="mt-1 flex flex-wrap items-center gap-2 text-[0.84rem] text-muted">
        <Pill tone="unknown" label="서버를 깨우는 중" />
        무료 서버라 처음 한 번은 1분쯤 걸립니다. 잠시만 기다려 주세요.
      </p>
    );
  }

  if (backend.kind === 'down') {
    return (
      <p className="mt-1 flex flex-wrap items-center gap-2 text-[0.84rem] text-muted">
        <Pill tone="fail" label="서버 연결 안 됨" />
        {backend.message} 잠시 뒤 새로고침해 주세요.
      </p>
    );
  }

  return (
    <p className="mt-1 flex flex-wrap items-center gap-2 text-[0.84rem] text-muted">
      <Pill tone="pass" label="규칙 엔진 정상" />
      <span className="tabular">
        기관 {backend.facilityCount}곳 · 제도 {backend.programCount}건 ·{' '}
        {backend.year}년 기준중위소득
      </span>
      {!backend.aiEnabled && (
        <>
          <Pill tone="unknown" label="대화형 입력 꺼짐" />
          <span className="text-faint">
            AI 키가 없어 직접 입력으로 진행합니다. 판정 결과는 동일합니다.
          </span>
        </>
      )}
    </p>
  );
}
