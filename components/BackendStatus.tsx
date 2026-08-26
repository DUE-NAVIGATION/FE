'use client';

import { useEffect, useState } from 'react';
import { getHealth } from '@/lib/api';

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; service: string }
  | { kind: 'down'; message: string };

/**
 * BE 연결 확인용 위젯. Phase 5 에서 실제 화면으로 교체된다.
 * 셋팅 직후 "백엔드가 안 떠 있어서 안 되는 것"을 바로 알아채기 위한 장치다.
 */
export default function BackendStatus() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    getHealth()
      .then((r) => setState({ kind: 'ok', service: r.service }))
      .catch((e: Error) => setState({ kind: 'down', message: e.message }));
  }, []);

  if (state.kind === 'loading') {
    return <p className="text-muted">백엔드 연결 확인 중…</p>;
  }
  if (state.kind === 'ok') {
    return (
      <p className="text-pass">
        ✅ 백엔드 연결됨 — <code>{state.service}</code>
      </p>
    );
  }
  return (
    <div className="text-unknown">
      <p>⚠ 백엔드에 연결할 수 없습니다 — {state.message}</p>
      <p className="mt-1 text-sm text-muted">
        <code>BE</code> 디렉터리에서 <code>./mvnw spring-boot:run</code> 을
        실행하세요.
      </p>
    </div>
  );
}
