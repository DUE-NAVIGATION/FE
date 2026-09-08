/**
 * DUE — BE ↔ FE API 계약 타입
 *
 * ★ 이 파일은 Go 백엔드 `api/internal/model/*` 의 거울이다.
 *   Go 쪽 struct 를 고치면 여기도 같이 고친다. 한쪽만 고치면 런타임에 깨진다.
 *
 *   대응표
 *     UserContext                       ← model/context.go
 *     Condition · Program               ← model/program.go
 *     ConditionResult · MatchResult · Summary ← model/result.go
 *     EvaluateResponse · ExtractResponse 등  ← handler/*.go
 *
 * 원칙 (CLAUDE.md 참조)
 *  - 판정은 백엔드 규칙 엔진이 한다. 프론트는 결과를 그리기만 한다.
 *  - 모르는 값은 FAIL 이 아니라 UNKNOWN 이다. 값이 없다고 탈락시키지 않는다.
 *  - 이 타입의 값을 localStorage·쿠키에 저장하지 않는다 (설계 원칙 2).
 */

// ────────────────────────────────────────────────────────────
// 1. 사용자 상황 (판정 입력값) — model/context.go
// ────────────────────────────────────────────────────────────

/** 주거 형태 */
export type HousingType =
  | 'MONTHLY_RENT' // 월세
  | 'JEONSE' // 전세
  | 'OWNED' // 자가
  | 'PUBLIC_LEASE' // 공공임대
  | 'FREE_USE' // 무상거주
  | 'OTHER';

/** 취업 상태 */
export type EmploymentStatus =
  | 'EMPLOYED' // 재직
  | 'SELF_EMPLOYED' // 자영업
  | 'LOST_JOB' // 실직
  | 'UNEMPLOYED' // 미취업
  | 'STUDENT' // 학생
  | 'RETIRED' // 은퇴
  | 'ON_LEAVE' // 휴직
  | 'OTHER';

export type DisabilityLevel = 'SEVERE' | 'MILD';

export type BasicLivelihoodType =
  | 'LIVELIHOOD' // 생계급여
  | 'MEDICAL' // 의료급여
  | 'HOUSING' // 주거급여
  | 'EDUCATION' // 교육급여
  | 'NONE'; // 수급자 아님

/**
 * 사용자 상황.
 *
 * ※ 모든 필드는 optional 이다 — 모르는 값이 있는 게 정상이다.
 *   Go 쪽은 전부 포인터(`*int`, `*bool` …)이며, "모름"과 "0"을 구분하기 위한
 *   설계다. TypeScript 에서는 `undefined` 가 그 역할을 한다.
 *   ★ 모르는 값에 0 이나 false 를 채워 보내지 마라. 0 은 "0원"이라는 뜻이다.
 * ※ 이름·주소·주민번호 등 식별정보는 이 타입에 절대 넣지 않는다.
 */
export interface UserContext {
  /** 가구원 수 (본인 포함) */
  householdSize?: number;
  /** 만 나이 */
  age?: number;
  /** 월 소득 (원). 소득평가액 기준 */
  incomeMonthly?: number;
  /** 재산 총액 (원). 지금은 제도별 재산 상한과 직접 비교한다 — 소득환산 파라미터는 미확정 */
  assets?: number;
  /** 주거 형태 */
  housingType?: HousingType;
  /** 보증금 (원) */
  deposit?: number;
  /** 월세 (원) */
  monthlyRent?: number;
  /** 취업 상태 */
  employmentStatus?: EmploymentStatus;
  /** 한부모 가구 여부 */
  isSingleParent?: boolean;
  /**
   * 자녀 나이 목록 (만 나이).
   * ★ `undefined` = 모름, `[]` = 자녀 없음. 둘은 다른 뜻이다.
   */
  childrenAges?: number[];
  /** 장애 여부 */
  hasDisability?: boolean;
  /** 장애 정도 (있을 경우) */
  disabilityLevel?: DisabilityLevel;
  /** 임신·출산 여부 */
  isPregnant?: boolean;
  /** 현재 수급 중인 제도 id 목록 (중복수급·배제 판정용) */
  receivingPrograms?: string[];
  /** 거주 지역 (시도 단위. 지역 한정 제도 판정용) */
  region?: string;
  /** 기초생활수급 자격 구분 */
  basicLivelihoodType?: BasicLivelihoodType;
  /**
   * 계산 엔진이 채우는 파생값 — 중위소득 대비 비율(%).
   * ★ 프론트에서 채워 보내지 않는다. 백엔드가 계산한다.
   */
  householdIncomePct?: number;
}

/** UserContext 의 키. 입력 폼을 조립할 때 쓴다. */
export type UserContextField = keyof UserContext;

// ────────────────────────────────────────────────────────────
// 2. 조건 (제도 자격요건의 최소 단위) — model/program.go
// ────────────────────────────────────────────────────────────

export type ConditionOp =
  | 'between' // value: [min, max] — 양 끝 포함
  | 'lte' // value: number
  | 'gte' // value: number
  | 'eq' // value: primitive
  | 'in' // value: primitive[] — 대상 값이 목록에 포함
  | 'contains' // value: primitive — 대상 배열이 값을 포함
  | 'exists'; // value 무시 — 값이 존재하기만 하면 PASS

export type ConditionValue =
  | number
  | string
  | boolean
  | Array<number | string>;

/** 단일 조건 */
export interface Condition {
  /**
   * 판정 대상 필드.
   * ★ Go 쪽이 `string` 이므로 여기서도 `string` 이다. 제도 JSON 에 오타가
   *   있어도 화면이 깨지지 않아야 한다 — 유효성은 백엔드가 검사한다.
   */
  field: string;
  op: ConditionOp;
  value?: ConditionValue;
  /** 화면에 보여줄 사람 말 설명. 예: "만 19~34세" */
  label?: string;
  /** 작성자 메모. 판정에는 쓰이지 않는다 */
  note?: string;
}

// ────────────────────────────────────────────────────────────
// 3. 제도 정의 (data/programs/*.json 과 1:1)
// ────────────────────────────────────────────────────────────

export type ProgramCategory =
  | 'HOUSING' // 주거
  | 'INCOME' // 소득·생계
  | 'EMPLOYMENT' // 고용
  | 'CHILDCARE' // 양육
  | 'MEDICAL' // 의료
  | 'EDUCATION' // 교육
  | 'ELDERLY' // 노인
  | 'DISABILITY' // 장애
  | 'ENERGY' // 에너지·공과금
  | 'OTHER';

/** 자격요건. all=AND, any=OR, none=배제 */
export interface Eligibility {
  all?: Condition[];
  any?: Condition[];
  none?: Condition[];
}

export type BenefitType =
  | 'MONTHLY' // 월 정액 × months
  | 'ONCE' // 1회성
  | 'YEARLY' // 연 정액
  | 'RATE' // 요금 감면율 등 (금액 산정 불가 → 합산에서 제외)
  | 'IN_KIND'; // 현물·서비스 (금액 없음)

export interface Benefit {
  type: BenefitType;
  /** 원 단위. RATE/IN_KIND 면 생략 */
  amount?: number;
  /** MONTHLY 일 때 지급 개월 수 */
  months?: number;
  /** RATE 일 때 감면율(%) */
  ratePct?: number;
  /** 금액 산정이 불가할 때의 설명 */
  note?: string;
}

export interface ApplyInfo {
  /** 신청 채널. 예: BOKJIRO, COMMUNITY_CENTER */
  channel: string[];
  /** 필요 서류 */
  documents: string[];
  /** 신청 기간 안내 */
  period?: string;
}

export interface SourceInfo {
  /** 공식 안내 페이지 URL */
  url: string;
  /** 개정일 (YYYY-MM-DD). 심사에서 물어본다 — 반드시 기입 */
  revisedAt: string;
  /** 출처 기관명 */
  agency?: string;
  /** 작성자 메모. 표현하지 못한 요건을 여기 남긴다 */
  note?: string;
}

/** 제도 정의 */
export interface Program {
  id: string;
  name: string;
  category: ProgramCategory;
  /** 한 줄 설명 */
  summary?: string;
  eligibility: Eligibility;
  benefit: Benefit;
  apply: ApplyInfo;
  source: SourceInfo;
}

// ────────────────────────────────────────────────────────────
// 4. 판정 결과 — model/result.go
// ────────────────────────────────────────────────────────────

/** 조건 단위 판정. UNKNOWN = 입력값이 없어 판정 불가. FAIL 이 아니다 */
export type ConditionStatus = 'PASS' | 'FAIL' | 'UNKNOWN';

export interface ConditionResult {
  condition: Condition;
  status: ConditionStatus;
  /** 사용자 입력의 실제 값 (화면의 "입력: 33세"). 모르면 없음 */
  actual?: unknown;
  /** 사람 말 사유 */
  reason: string;
}

/**
 * 제도별 판정 결과.
 *  ELIGIBLE    — 확인된 조건이 전부 충족
 *  INELIGIBLE  — 명시적으로 탈락
 *  NEEDS_INFO  — 탈락은 아니지만 확인이 더 필요
 */
export type MatchStatus = 'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_INFO';

export interface MatchResult {
  program: Program;
  status: MatchStatus;
  /** 조건 단위 근거. 설명 가능성의 핵심 — 항상 채워져 온다 */
  conditions: ConditionResult[];
  /** 연간 예상 수령액 (원). 산정 불가면 0 */
  estimatedAmount: number;
  /**
   * 판정에 더 필요한 필드 이름.
   * ★ status 가 NEEDS_INFO 일 때만 채워진다. 제도 JSON 오류로 생긴
   *   UNKNOWN 은 여기 들어오지 않는다 (사용자에게 물어볼 것이 아니므로).
   */
  missingFields: string[];
}

/** 결과 화면 상단의 요약 */
export interface Summary {
  eligibleCount: number;
  needsInfoCount: number;
  ineligibleCount: number;
  /** ELIGIBLE 만 합산한 연간 예상액 (원) */
  totalAnnualAmount: number;
  /** 중복수급 배제로 제거된 제도 id */
  excludedByConflict?: string[];
}

// ────────────────────────────────────────────────────────────
// 5. 제도 간 관계 (중복수급 판정)
// ────────────────────────────────────────────────────────────

export type RelationType =
  | 'EXCLUSIVE' // 동시 수급 불가
  | 'REDUCING' // 동시 수급 시 감액
  | 'PREREQUISITE'; // 선행 조건

export interface Relation {
  from: string;
  to: string;
  type: RelationType;
  /** REDUCING 일 때 감액률(%) */
  reducePct?: number;
  reason?: string;
}

// ────────────────────────────────────────────────────────────
// 6. 기준중위소득 표 — data/median-income.json 과 1:1
// ────────────────────────────────────────────────────────────

/**
 * 재산 → 월 소득 환산 파라미터.
 *
 * ★ 아직 확인하지 못해 `null` 이다 (2026-09-09 자문 예정). 추측해 채우지 마라.
 *   비어 있는 동안 `assets` 는 제도별 재산 상한과 직접 비교만 한다.
 */
export interface PropertyConversion {
  /** 기본재산액 (원). 이 금액까지는 환산하지 않는다 */
  basicDeduction: number;
  /** 월 소득환산율 (%) */
  monthlyRatePct: number;
  source: SourceInfo;
}

export interface MedianIncomeTable {
  /** 기준연도 */
  year: number;
  source: SourceInfo;
  /** 가구원수 → 월 기준중위소득 (원). 키는 문자열이다 */
  byHouseholdSize: Record<string, number>;
  /** 표에 없는 큰 가구는 1인 증가시마다 이 금액을 더한다 */
  extraPerPerson: number;
  /** 확인되지 않았으면 null */
  propertyConversion: PropertyConversion | null;
}

// ────────────────────────────────────────────────────────────
// 7. AI 계층 — 구조화·설명 전용. 판정 금지
// ────────────────────────────────────────────────────────────

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

/** 전송 전에 가린 민감정보의 종류 — ai/sanitize.go */
export type SanitizeKind =
  | 'RESIDENT_ID' // 주민등록번호·외국인등록번호
  | 'CARD_NUMBER' // 카드번호
  | 'ACCOUNT_NUMBER' // 계좌번호
  | 'PHONE' // 전화번호
  | 'EMAIL'; // 이메일

// ────────────────────────────────────────────────────────────
// 8. API 응답 봉투 — handler/*.go
// ────────────────────────────────────────────────────────────

/** GET /healthz */
export interface HealthResponse {
  status: string;
  service: string;
  /** 항상 false. 설계 원칙 2를 서버가 직접 밝힌다 */
  storesUserData: boolean;
  programCount: number;
  medianIncomeYear: number;
  /** false 면 첫 화면부터 직접 입력 폼을 띄운다 */
  aiEnabled: boolean;
}

/** GET /api/programs */
export interface ProgramsResponse {
  programs: Program[];
  count: number;
  /** 읽다가 건너뛴 제도 파일. 조용히 빠지지 않게 노출한다 */
  problems?: Array<{ file: string; reason: string }>;
  disclaimer: string;
}

/** POST /api/evaluate */
export interface EvaluateRequest {
  context: UserContext;
}

/** 결과 화면이 그릴 모든 것 */
export interface EvaluateResponse {
  /** 해당 → 확인필요 → 미해당 순으로 이미 정렬되어 온다. 다시 정렬하지 마라 */
  results: MatchResult[];
  summary: Summary;
  /** 중위소득 대비 비율(%). 계산할 수 없었으면 null */
  incomePct: number | null;
  /** 기준중위소득 표의 기준연도. "2026년 기준"으로 표시한다 */
  medianIncomeYear: number;
  disclaimer: string;
}

/** POST /api/extract */
export interface ExtractRequest {
  text: string;
}

export interface ExtractResponse {
  extracted: UserContext;
  confidence: Partial<Record<string, Confidence>>;
  followUpQuestions: string[];
  /**
   * 전송 전에 가린 민감정보의 종류·건수.
   * ★ 가려진 값 자체는 들어 있지 않다. 없는 걸 그리려 하지 마라.
   */
  sanitized?: Partial<Record<SanitizeKind, number>>;
  disclaimer: string;
}

/** POST /api/explain */
export interface ExplainRequest {
  results: MatchResult[];
  summary: Summary;
}

export interface ExplainResponse {
  explanation: string;
  disclaimer: string;
}

/**
 * 모든 실패 응답의 형태.
 *   { "error": { "code": "INVALID_JSON", "message": "..." } }
 */
export interface ErrorBody {
  error: { code: ApiErrorCode | string; message: string };
}

/** 프론트가 문자열 비교로 분기하는 에러 코드 — handler/respond.go */
export type ApiErrorCode =
  | 'INVALID_JSON'
  | 'INVALID_REQUEST'
  | 'BODY_TOO_LARGE'
  | 'NOT_FOUND'
  | 'NOT_IMPLEMENTED'
  | 'INTERNAL'
  /** 키가 없어 AI 를 쓸 수 없다 → 수동 입력으로 폴백 */
  | 'AI_UNAVAILABLE'
  /** 호출했지만 실패했다 → 수동 입력으로 폴백 */
  | 'AI_FAILED';
