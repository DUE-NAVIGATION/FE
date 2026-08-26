import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, getHealth } from './api';

/** fetch 를 가로채고, 호출된 URL 과 옵션을 돌려준다 */
function stubFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  const spy = vi.fn(impl);
  vi.stubGlobal('fetch', spy);
  return spy;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('getHealth', () => {
  // ★ 이 경로가 어긋나면 첫 화면이 "백엔드에 연결할 수 없습니다" 로 뜬다.
  // 백엔드는 /healthz 로 서빙한다 — 다른 엔드포인트와 달리 /api 접두어가 없다.
  it('/healthz 를 부른다', async () => {
    const spy = stubFetch(async () =>
      jsonResponse({ status: 'ok', service: 'due-api', storesUserData: false }),
    );

    const res = await getHealth();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toBe('http://localhost:8080/healthz');
    expect(res.service).toBe('due-api');
    expect(res.storesUserData).toBe(false);
  });

  it('저장하지 않는다는 응답을 그대로 읽는다', async () => {
    stubFetch(async () =>
      jsonResponse({ status: 'ok', service: 'due-api', storesUserData: false }),
    );
    await expect(getHealth()).resolves.toMatchObject({ storesUserData: false });
  });
});

describe('request', () => {
  it('응답을 캐시하지 않는다', async () => {
    const spy = stubFetch(async () => jsonResponse({}));

    await api.get('/api/programs');

    // 설계 원칙 2 — 사용자 상황이 담긴 응답이 디스크 캐시에 남으면 안 된다
    expect(spy.mock.calls[0][1]?.cache).toBe('no-store');
  });

  it('POST 는 JSON 으로 보낸다', async () => {
    const spy = stubFetch(async () => jsonResponse({}));

    await api.post('/api/evaluate', { context: { age: 29 } });

    const init = spy.mock.calls[0][1];
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"context":{"age":29}}');
    expect(
      (init?.headers as Record<string, string>)['Content-Type'],
    ).toBe('application/json');
  });

  it('4xx·5xx 를 ApiError 로 바꾼다', async () => {
    stubFetch(async () => jsonResponse({ error: { code: 'BAD' } }, 500));

    await expect(api.get('/api/programs')).rejects.toBeInstanceOf(ApiError);
    await expect(api.get('/api/programs')).rejects.toMatchObject({ status: 500 });
  });

  it('연결 실패를 사람 말 메시지로 바꾼다', async () => {
    stubFetch(async () => {
      throw new TypeError('fetch failed');
    });

    // 백엔드가 안 떠 있을 때 BackendStatus 에 그대로 표시되는 문구다
    await expect(api.get('/healthz')).rejects.toThrow('서버에 연결할 수 없습니다.');
  });

  it('8초를 넘기면 중단하고 수동 입력을 안내한다', async () => {
    vi.useFakeTimers();
    stubFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          // AbortController 가 끊어주기를 기다린다
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    );

    const pending = api.get('/api/evaluate');
    const assertion = expect(pending).rejects.toThrow('직접 입력해 주세요');

    await vi.advanceTimersByTimeAsync(8_000);
    await assertion;
  });
});
