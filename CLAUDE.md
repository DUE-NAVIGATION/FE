# FE — DUE 프론트엔드

복지 사각지대 내비게이터의 프론트엔드. 대화형 입력, 판정 결과 표시, 문서 업로드를 담당한다.

- 백엔드: https://github.com/DUE-NAVIGATION/be
- 프로젝트 전체 설명·설계: https://github.com/DUE-NAVIGATION/.github

## 이 모듈의 책임

화면만. **판정 로직을 여기에 두지 않는다.** 자격 판정·금액 계산은 전부 백엔드가 한다.

## ★ 최상위 설계 원칙 (절대 어기지 말 것)

### 1. 판정은 AI가 하지 않는다 — 그리고 프론트도 하지 않는다

- 자격 판정과 금액 계산은 백엔드의 **결정론적 규칙 엔진**이 한다
- 프론트는 `MatchResult`를 받아 그리기만 한다. 임계값·금액을 FE에서 다시 계산하지 마라
- LLM을 프론트에서 직접 호출하지 않는다. `ANTHROPIC_API_KEY`를 FE 환경변수에 두지 않는다
  (키가 브라우저로 나간다)

### 2. 아무것도 저장하지 않는다

- 로그인 없음. 마이페이지 없음
- `localStorage` · `sessionStorage` · 쿠키에 사용자 입력을 저장하지 않는다
- Zustand를 쓰되 **persist 미들웨어 금지**. 새로고침하면 사라지는 게 정상이자 기능이다
- 결과는 사용자가 직접 저장한다 (PDF 다운로드). 공유 링크를 만들지 않는다
- 이것이 발표의 핵심 장면이다 — 심사 중에 실제로 새로고침해서 보여준다

### 3. 단정하지 않는다

- 결과는 `해당` / `확인필요` / `미해당` 세 가지. 상태별로 그룹을 나눠 보여준다
- 조건별 충족 여부를 항상 함께 보여준다 (설명 가능성). 이 화면이 승부처다
- 하단 고지(`components/Disclaimer.tsx`)가 어디서나 보여야 한다. 제거 금지

## 기술 스택

Next.js (App Router) · TypeScript · Tailwind v4 · Zustand(세션 한정) · Vitest

## 구조

```
/app          라우트
/components   UI
/lib          api.ts — 백엔드 호출 클라이언트
/types        index.ts — 백엔드 internal/model 의 거울
```

## 규칙

- `types/index.ts`는 백엔드(Go) `internal/model/*`의 **거울**이다.
  한쪽만 고치면 런타임에 깨진다. 반드시 같이 고친다
  - 필드명은 camelCase, enum 값은 UPPER_SNAKE 로 통일한다 (`ELIGIBLE`, `HIGH`)
  - 연산자(`between` `lte` …)만 예외적으로 소문자다. 제도 JSON 을 사람이 쓰기 때문
- 백엔드 호출은 `lib/api.ts`를 거친다. 타임아웃 8초, 실패 시 수동 입력 폼으로 폴백
- 제도명·금액을 하드코딩하지 않는다. 전부 백엔드 응답에서 온다

## 디자인 원칙

- 복지 서비스답게 **신뢰감 있고 차분하게**. 과한 애니메이션 금지
- 글자 크게(기본 18px), 명도대비 충분히 — **고령자도 사용자다**
- 다크모드 자동 전환을 쓰지 않는다. 프로젝터는 대비가 낮게 나오고,
  시연 노트북 설정에 따라 화면이 바뀌면 데모가 위험하다
- 발표 화면 해상도(1920×1080)에서 글자가 충분히 큰지 확인한다

## 작업 방식

1. 코드 변경 시 **파일 전체 출력**. 부분 스니펫 금지
2. 해커톤이다. 스코프를 넓히지 마라. 요청 범위만
3. 데모에 안 나오는 기능은 만들지 않는다

## 하지 말 것

- 판정 로직을 FE에 복제 (백엔드가 단일 소스)
- 사용자 입력을 localStorage·쿠키에 저장
- 로그인·마이페이지·관리자 화면
- FE에서 LLM 직접 호출

## 명령어

```bash
npm run dev        # http://localhost:3000
npm run build
npm run typecheck
npm run lint
npm test
```

백엔드가 떠 있어야 첫 화면 상단에 "규칙 엔진 정상 · 제도 N건"이 표시된다.
AI 키가 없으면 "대화형 입력 꺼짐"이 함께 뜨고 직접 입력 폼으로 진행된다 — 판정 결과는 동일하다.

★ 포트 주의. 3000이 다른 프로세스에 잡히면 Next 가 3001로 뜨고, 백엔드 CORS 기본값이
`http://localhost:3000` 하나라 **모든 요청이 막힌다**. 화면에는 "백엔드 없음"만 보인다.
`.env.local` 의 `NEXT_PUBLIC_API_BASE_URL` 과 백엔드의 `CORS_ALLOWED_ORIGINS` 를 함께 맞춘다.

## 진행 현황

- [x] Phase 0 — 셋업 + API 계약 타입
- [~] Phase 5 — 판정 결과(`/result`) · 조건별 근거표 · 직접 입력(`/`) 완료.
      대화형 입력(자유 서술 → `/api/extract`)은 화면까지 붙였으나 AI 키가 없어 미검증
- [ ] Phase 6 — 문서 업로드 화면 (여유 시)
- [ ] Phase 7 — 데모 안정화 (스켈레톤, 폴백, 새로고침 시연, 반응형) ★ 반드시

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
