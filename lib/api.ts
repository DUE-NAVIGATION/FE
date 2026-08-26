/**
 * 백엔드(Go · net/http) 호출 클라이언트.
 *
 * ★ AI 키는 프론트에 두지 않는다. LLM 호출은 전부 백엔드가 한다.
 * ★ 응답을 캐시·저장하지 않는다. 화면이 살아 있는 동안만 메모리에 둔다.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

/** 데모에서 8초 넘게 멈춰 있으면 안 된다 (Phase 7) */
const TIMEOUT_MS = 8_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      cache: 'no-store', // 저장하지 않는다
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });

    if (!res.ok) {
      throw new ApiError(`요청이 실패했습니다 (${res.status})`, res.status);
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === 'AbortError') {
      // 실패 시 수동 입력 폼으로 폴백한다 (Phase 7)
      throw new ApiError('응답이 너무 오래 걸립니다. 직접 입력해 주세요.');
    }
    throw new ApiError('서버에 연결할 수 없습니다.');
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
};

export interface HealthResponse {
  status: string;
  service: string;
  storesUserData: boolean;
}

/**
 * 연결 확인용. Phase 5 에서 실제 판정 API 가 여기에 붙는다.
 *
 * ★ 경로는 `/healthz` 다. 다른 엔드포인트와 달리 `/api` 접두어가 없다
 *   (BE 의 API 계약 참조). 임의로 `/api/health` 로 바꾸면 연결이 깨진다.
 */
export const getHealth = () => api.get<HealthResponse>('/healthz');
