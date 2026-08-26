/**
 * DUE — BE ↔ FE API 계약 타입
 *
 * ★ 이 파일은 백엔드 `BE/src/main/java/com/due/domain/*` 의 거울이다.
 *   Java 쪽 record 를 고치면 여기도 같이 고친다. 한쪽만 고치면 런타임에 깨진다.
 *
 * 원칙 (CLAUDE.md 참조)
 *  - 판정은 백엔드 규칙 엔진이 한다. 프론트는 결과를 그리기만 한다.
 *  - 모르는 값은 FAIL 이 아니라 UNKNOWN 이다. 값이 없다고 탈락시키지 않는다.
 *  - 이 타입의 값을 localStorage·쿠키에 저장하지 않는다 (설계 원칙 2).
 */

// ────────────────────────────────────────────────────────────
// 1. 사용자 상황 (판정 입력값)
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

/**
 * 사용자 상황.
 *
 * ※ 모든 필드는 optional 이다 — 모르는 값이 있는 게 정상이다.
 *   비어 있는 필드는 그 조건을 UNKNOWN 으로 만들고, 결과는 NEEDS_INFO 가 된다.
 * ※ 이름·주소·주민번호 등 식별정보는 이 타입에 절대 넣지 않는다.
 */
export interface UserContext {
  /** 가구원 수 (본인 포함) */
  householdSize?: number;
  /** 만 나이 */
  age?: number;
  /** 월 소득 (원). 세전 소득평가액 기준 */
  incomeMonthly?: number;
  /** 재산 총액 (원). 소득환산 대상 */
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
  /** 자녀 나이 목록 (만 나이) */
  childrenAges?: number[];
  /** 장애 여부 */
  hasDisability?: boolean;
  /** 장애 정도 (있을 경우) */
  disabilityLevel?: 'SEVERE' | 'MILD';
  /** 임신·출산 여부 */
  isPregnant?: boolean;
  /** 현재 수급 중인 제도 id 또는 급여 코드 목록 (중복수급·배제 판정용) */
  receivingPrograms?: string[];
  /** 거주 지역 (시도 단위. 지역 한정 제도 판정용) */
  region?: string;
  /** 기초생활수급 자격 구분 */
  basicLivelihoodType?: 'LIVELIHOOD' | 'MEDICAL' | 'HOUSING' | 'EDUCATION' | 'NONE';
  /** 계산 엔진이 채우는 파생값 — 중위소득 대비 비율(%) */
  householdIncomePct?: number;
}

/** UserContext 의 키. 조건의 field 는 이 중 하나여야 한다. */
export type UserContextField = keyof UserContext;

// ────────────────────────────────────────────────────────────
// 2. 조건 (제도 자격요건의 최소 단위)
// ────────────────────────────────────────────────────────────

export type ConditionOp =
  | 'between' // value: [min, max] — 양 끝 포함
  | 'lte' // value: number
  | 'gte' // value: number
  | 'eq' // value: primitive
  | 'in' // value: primitive[] — 대상 값이 목록에 포함
  | 'contains' // value: primitive — 대상 배열이 값을 포함
  | 'exists'; // value 무시 — 값이 존재하기만 하면 PASS

export type ConditionValue = number | string | boolean | Array<number | string>;

/** 단일 조건 */
export interface Condition {
  /** 판정 대상 필드 */
  field: UserContextField;
  op: ConditionOp;
  value?: ConditionValue;
  /** 화면에 보여줄 사람 말 설명. 예: "만 19~34세" */
  label?: string;
  /** 작성자 메모. 판정에는 쓰이지 않는다 */
  note?: string;
}

// ────────────────────────────────────────────────────────────
// 3. 제도 정의 (제도 JSON 과 1:1)
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
  /** 금액이 가구원수·소득에 따라 달라지는 등, 단순 산정이 불가할 때의 설명 */
  note?: string;
}

export interface ApplyInfo {
  /** 신청 채널 */
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
  revised_at: string;
  /** 출처 기관명 */
  agency?: string;
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
// 4. 판정 결과
// ────────────────────────────────────────────────────────────

/** 조건 단위 판정. UNKNOWN = 입력값이 없어 판정 불가 */
export type ConditionStatus = 'PASS' | 'FAIL' | 'UNKNOWN';

export interface ConditionResult {
  condition: Condition;
  status: ConditionStatus;
  /** 사용자 입력의 실제 값 (화면의 "입력: 29세") */
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
  /** 조건 단위 근거. 설명 가능성의 핵심 — 항상 채운다 */
  conditions: ConditionResult[];
  /** 연간 예상 수령액 (원). 산정 불가면 undefined */
  estimatedAmount?: number;
  /** 판정에 더 필요한 필드 목록 */
  missingFields: UserContextField[];
}

/** 전체 판정 결과 (화면 상단 요약의 원본) */
export interface MatchSummary {
  eligible: MatchResult[];
  needsInfo: MatchResult[];
  ineligible: MatchResult[];
  /** eligible 합산 연간 예상액 (원) */
  totalYearlyAmount: number;
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

export interface ProgramRelation {
  from: string;
  to: string;
  type: RelationType;
  /** REDUCING 일 때 감액률(%) */
  reducePct?: number;
  reason?: string;
}

// ────────────────────────────────────────────────────────────
// 6. 기준중위소득 표
// ────────────────────────────────────────────────────────────

export interface MedianIncomeTable {
  /** 기준연도 */
  year: number;
  source: SourceInfo;
  /** 가구원수 → 월 기준중위소득 (원) */
  byHouseholdSize: Record<string, number>;
}

// ────────────────────────────────────────────────────────────
// 7. AI 계층 (구조화 전용 — 판정 금지)
// ────────────────────────────────────────────────────────────

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

/** 자연어 → UserContext 추출 결과. 백엔드 com.due.ai.ExtractionResult 와 대응 */
export interface ExtractionResult {
  extracted: UserContext;
  confidence: Partial<Record<UserContextField, Confidence>>;
  followUpQuestions: string[];
}

// ────────────────────────────────────────────────────────────
// 8. 문서 번역 (Phase 6)
// ────────────────────────────────────────────────────────────

export interface DocumentReading {
  /** 중학생 수준 요약 */
  summary: string;
  /** 이게 무슨 문서인지 */
  whatIsIt: string;
  /** 내가 해야 할 일 */
  whatYouMustDo: string[];
  /** 기한 (YYYY-MM-DD 또는 사람 말) */
  deadline?: string;
  /** 안 하면 생기는 일 */
  consequenceIfIgnored?: string;
  /** 문서에서 드러난 상황 — 제도 매칭으로 연결 */
  inferredContext?: UserContext;
}
