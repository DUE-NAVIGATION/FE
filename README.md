# DUE — FE

복지 사각지대 내비게이터 프론트엔드. Next.js 16 (App Router) · TypeScript · Tailwind v4.

> due = "마땅히 지급되어야 할". **이건 원래 당신 것입니다.**

- 백엔드: https://github.com/DUE-NAVIGATION/be
- 프로젝트 설명: https://github.com/DUE-NAVIGATION/.github

## 시작하기

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_BASE_URL = 백엔드 주소
npm run dev                    # http://localhost:3000
```

백엔드가 떠 있으면 입력 화면 위에 **"규칙 엔진 정상 · 기관 N곳 · 제도 N건"** 이 보인다.

```bash
cd ../be && go run ./cmd/server   # http://localhost:8080
```

★ Next 가 3000 이 아닌 포트로 뜨면 백엔드의 `CORS_ALLOWED_ORIGINS` 에 그 오리진을 넣어야 한다.

| 명령어 | 설명 |
| ------ | ---- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run typecheck` | 타입 검사 |
| `npm run lint` | ESLint |
| `npm test` | Vitest |

## 화면

| 경로 | 화면 |
| ---- | ---- |
| `/` | 소개 — 무엇을 해 주는 곳인지, 세 걸음, 공공·민간, 지키는 약속 |
| `/start` | 상황 입력 — 직접 입력 폼 (AI 키가 있으면 자유 서술 입력도) |
| `/result` | 결과 — **공공 기관 / 민간 기관** 구역과 구분선, 전화·지도·준비물·문의 문구, 아래에 지원금 |

새로고침하면 `/result` 가 비어 "결과가 사라졌습니다. 그렇게 만들었습니다." 가 뜬다 — 의도한 동작이다.

## 구조

```
/app          라우트 (/, /start, /result)
/components   FacilityCard · EvidenceTable · ProgramRow · SiteHeader · CtaLink · Reveal · Disclaimer …
/lib          api.ts 백엔드 호출 · facility.ts 시설 표기·공공/민간·문의 문구 · format.ts 표기·조사
/types        index.ts — 백엔드(Go) internal/model 의 거울
```

## 규칙 (요약)

1. **판정하지 않는다.** 판정·금액은 전부 백엔드. 화면은 받은 것을 나눠 그리기만 한다
2. **저장하지 않는다.** localStorage·쿠키·Zustand persist 금지
3. **없는 것을 지어내지 않는다.** 연락처·운영시간이 비면 그 수단을 감추거나 "전화로 확인" 이라고 쓴다
4. **문의 문구는 기기 밖으로 나가지 않는다.** 전송은 이용자의 문자·메일 앱이 한다
5. **고지를 지우지 않는다.** `components/Disclaimer.tsx` 는 모든 화면에 보인다

전체 규칙과 디자인 원칙은 [CLAUDE.md](CLAUDE.md).
