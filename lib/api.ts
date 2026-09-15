/**
 * 백엔드(Go · net/http) 호출 클라이언트.
 *
 * ★ AI 키는 프론트에 두지 않는다. LLM 호출은 전부 백엔드가 한다.
 * ★ 응답을 캐시·저장하지 않는다. 화면이 살아 있는 동안만 메모리에 둔다.
 * ★ 판정을 여기서 하지 않는다. 임계값·금액을 다시 계산하지 마라.
 */

import type {
  ApiErrorCode,
  ErrorBody,
  EvaluateRequest,
  EvaluateResponse,
  ExplainRequest,
  ExplainResponse,
  ExtractResponse,
  HealthResponse,
  ProgramsResponse,
  RegionsResponse,
  UserContext,
} from '@/types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

/** 데모에서 8초 넘게 멈춰 있으면 안 된다 (Phase 7) */
const TIMEOUT_MS = 8_000;

/**
 * 백엔드가 돌려준 실패.
 *
 * `code` 로 분기한다 — 메시지 문자열로 분기하지 마라. 문구는 바뀐다.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: ApiErrorCode | 'NETWORK' | 'TIMEOUT',
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** AI 를 못 쓰는 상황인가 — 두 경우 모두 직접 입력으로 폴백한다 */
  get isAiFallback(): boolean {
    return this.code === 'AI_UNAVAILABLE' || this.code === 'AI_FAILED';
  }

  /** 서버에 닿지 못했는가 — 판정 자체를 못 한다 */
  get isOffline(): boolean {
    return this.code === 'NETWORK' || this.code === 'TIMEOUT';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      cache: 'no-store', // 저장하지 않는다
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError(
        '응답이 너무 오래 걸립니다. 직접 입력해 주세요.',
        'TIMEOUT',
      );
    }
    throw new ApiError('서버에 연결할 수 없습니다.', 'NETWORK');
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    // 백엔드는 실패도 { error: { code, message } } 로 돌려준다.
    // 형식이 깨진 경우에만 상태코드로 대체한다.
    let code: ApiErrorCode | 'NETWORK' = 'INTERNAL';
    let message = `요청이 실패했습니다 (${res.status})`;
    try {
      const body = (await res.json()) as ErrorBody;
      if (body?.error?.code) code = body.error.code as ApiErrorCode;
      if (body?.error?.message) message = body.error.message;
    } catch {
      // JSON 이 아니면 위의 기본값을 쓴다
    }
    throw new ApiError(message, code, res.status);
  }

  return (await res.json()) as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });

// ────────────────────────────────────────────────────────────
// 엔드포인트
// ────────────────────────────────────────────────────────────

/**
 * 서버 상태. `aiEnabled` 로 첫 화면의 입력 방식을 정한다.
 *
 * ★ 경로는 `/healthz` 다. 다른 엔드포인트와 달리 `/api` 접두어가 없다
 *   (BE 의 API 계약 참조). 임의로 `/api/health` 로 바꾸면 연결이 깨진다.
 */
export const getHealth = () => get<HealthResponse>('/healthz');

/** 지금 서버가 읽고 있는 제도 목록. 데이터 작성 확인용 */
export const getPrograms = () => get<ProgramsResponse>('/api/programs');

/** 시·군·구 선택 목록. 실패해도 화면은 직접 입력으로 돌아간다 */
export const getRegions = () => get<RegionsResponse>('/api/regions');

/**
 * 판정. 이 서비스의 본체다.
 *
 * 결과는 해당 → 확인필요 → 미해당 순으로 정렬되어 온다. 다시 정렬하지 마라.
 */
export const evaluate = (context: UserContext) =>
  post<EvaluateResponse>('/api/evaluate', { context } satisfies EvaluateRequest);

/**
 * 자연어 → 판정 입력값.
 *
 * ★ 여기서 판정하지 않는다. 결과의 `extracted` 를 그대로 evaluate 에 넣는다.
 * 실패하면 ApiError.isAiFallback 이 true 다 — 직접 입력 화면으로 보낸다.
 */
export const extract = (text: string) =>
  post<ExtractResponse>('/api/extract', { text });

/**
 * 판정 결과 → 사람 말 설명.
 *
 * ★ 사용자 상황을 보내지 않는다. 이미 나온 결과만 보낸다.
 * 실패해도 결과 화면은 그대로 쓸 수 있다 — 설명문만 비운다.
 */
export const explain = (req: ExplainRequest) =>
  post<ExplainResponse>('/api/explain', req);

/**
 * 경로를 직접 지정하는 저수준 호출.
 *
 * 화면 코드는 위의 이름 붙은 함수를 쓴다. 이건 `lib/api.test.ts` 가
 * 공통 처리(no-store · 타임아웃 · 에러 변환)를 경로와 무관하게 검증하기 위한 창구다.
 */
export const api = { get, post };
