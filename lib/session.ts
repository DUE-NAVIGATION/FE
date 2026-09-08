/**
 * 세션 상태.
 *
 * ★★ persist 미들웨어를 붙이지 않는다. localStorage·sessionStorage·쿠키
 *    어디에도 쓰지 않는다. 새로고침하면 사라지는 것이 정상이자 기능이다.
 *    (설계 원칙 2 — 아무것도 저장하지 않는다)
 *
 *    심사 중에 실제로 새로고침해서 보여준다. 그 장면이 이 프로젝트의 주장이다.
 *    편의를 위해 저장을 추가하지 마라.
 */

'use client';

import { create } from 'zustand';
import type { EvaluateResponse, ExtractResponse, UserContext } from '@/types';

interface SessionState {
  /** 판정 입력값. 대화형 추출 결과 또는 직접 입력이 여기 모인다 */
  context: UserContext;
  /** 구조화 단계에서 나온 되묻기·확신도·마스킹 내역 */
  extraction: ExtractResponse | null;
  /** 마지막 판정 결과. 이 값이 없으면 /result 는 그릴 것이 없다 */
  result: EvaluateResponse | null;
  /** AI 가 쓴 결과 설명문. 실패해도 결과 화면은 그대로 쓴다 */
  explanation: string | null;

  setContext: (patch: UserContext) => void;
  setExtraction: (e: ExtractResponse | null) => void;
  setResult: (r: EvaluateResponse | null) => void;
  setExplanation: (s: string | null) => void;
  /** 전부 비운다. "지우기" 버튼과 데모 초기화에 쓴다 */
  reset: () => void;
}

const EMPTY = {
  context: {} as UserContext,
  extraction: null,
  result: null,
  explanation: null,
};

export const useSession = create<SessionState>((set) => ({
  ...EMPTY,

  // 부분 갱신이다. 사용자가 값 하나를 고쳐도 나머지가 날아가면 안 된다.
  setContext: (patch) =>
    set((s) => ({ context: { ...s.context, ...patch } })),

  setExtraction: (extraction) => set({ extraction }),
  setResult: (result) => set({ result }),
  setExplanation: (explanation) => set({ explanation }),

  reset: () => set({ ...EMPTY, context: {} }),
}));
