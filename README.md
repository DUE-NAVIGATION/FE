# DUE — FE

복지 사각지대 내비게이터 프론트엔드. Next.js (App Router) + TypeScript + Tailwind.

> due = "마땅히 지급되어야 할". **이건 원래 당신 것입니다.**

- 백엔드: https://github.com/DUE-NAVIGATION/be
- 프로젝트 전체 설명·설계: https://github.com/DUE-NAVIGATION/.github

## 시작하기

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_BASE_URL 확인
npm run dev                    # http://localhost:3000
```

백엔드가 `http://localhost:8080`에 떠 있어야 첫 화면에 **"✅ 백엔드 연결됨"**이 표시된다.

| 명령어              | 설명            |
| ------------------- | --------------- |
| `npm run dev`       | 개발 서버       |
| `npm run build`     | 프로덕션 빌드   |
| `npm run typecheck` | 타입 검사       |
| `npm run lint`      | ESLint          |
| `npm test`          | Vitest          |

## 구조

```
/app          라우트
/components   UI (Disclaimer, BackendStatus …)
/lib          api.ts — 백엔드 호출 클라이언트 (타임아웃 8초, 폴백)
/types        index.ts — 백엔드 com.due.domain 의 거울
```

## 이 저장소의 규칙 (요약)

1. **판정 로직을 FE에 두지 않는다.** 자격 판정·금액 계산은 전부 백엔드.
   FE는 `MatchResult`를 받아 그리기만 한다
2. **아무것도 저장하지 않는다.** localStorage·쿠키 금지, Zustand persist 금지.
   새로고침하면 사라지는 게 정상이자 기능이다
3. **LLM을 FE에서 호출하지 않는다.** API 키가 브라우저로 나가면 안 된다
4. **고지를 지우지 않는다.** `components/Disclaimer.tsx`는 모든 화면에 보인다

전체 규칙은 [CLAUDE.md](CLAUDE.md) 참조.

## 현재 상태

Phase 0 완료 — 셋업, API 계약 타입, 백엔드 연결 확인.
다음은 **Phase 5 결과 화면**. 데모의 승부처이므로 결과 화면부터 만든다.
