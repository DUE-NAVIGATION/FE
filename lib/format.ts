/**
 * 화면 표기 도우미.
 *
 * ★ 여기서 판정하거나 금액을 계산하지 않는다. 받은 숫자를 읽기 좋게 바꿀 뿐이다.
 */

/** 1234567 → "1,234,567" */
export function comma(n: number): string {
  return n.toLocaleString('ko-KR');
}

/** 2760000 → "2,760,000원". 0이면 금액 없음으로 본다 */
export function won(n: number): string {
  return `${comma(n)}원`;
}

/**
 * 61.30512 → "61.3".
 * 소수점이 길게 흘러나오면 화면이 지저분해지고 정밀해 보이는 착시가 생긴다.
 */
export function pct(n: number): string {
  return n.toFixed(1);
}

/**
 * 급여 구조를 한 줄로. "월 230,000 × 12개월"
 *
 * 백엔드가 계산한 estimatedAmount 를 대체하는 게 아니라 그 **근거**를 적는 것이다.
 */
export function benefitBasis(b: {
  type: string;
  amount?: number;
  months?: number;
  ratePct?: number;
}): string {
  switch (b.type) {
    case 'MONTHLY':
      return b.amount
        ? `월 ${comma(b.amount)} × ${b.months ?? 12}개월`
        : '월 지급';
    case 'YEARLY':
      return b.amount ? `연 ${comma(b.amount)}` : '연 지급';
    case 'ONCE':
      return b.amount ? `1회 ${comma(b.amount)}` : '1회 지급';
    case 'RATE':
      return b.ratePct ? `요금 ${b.ratePct}% 감면` : '요금 감면';
    case 'IN_KIND':
      return '현물·서비스 지원';
    default:
      return '';
  }
}

/** 신청 채널 코드를 사람 말로. 모르는 코드는 그대로 둔다 */
const CHANNEL_LABEL: Record<string, string> = {
  BOKJIRO: '복지로',
  COMMUNITY_CENTER: '주민센터',
  ONLINE: '온라인',
  WORKNET: '워크넷',
  EMPLOYMENT_CENTER: '고용센터',
  PHONE: '전화',
  MAIL: '우편',
};

export function channelLabel(code: string): string {
  return CHANNEL_LABEL[code] ?? code;
}

/**
 * UserContext 필드 이름을 사람 말로.
 *
 * missingFields 를 "월 소득, 주거 형태를 알려주시면" 으로 바꾸는 데 쓴다.
 * 모르는 필드는 원래 이름을 그대로 보여준다 — 조용히 숨기면 원인을 못 찾는다.
 */
const FIELD_LABEL: Record<string, string> = {
  householdSize: '가구원 수',
  age: '나이',
  incomeMonthly: '월 소득',
  assets: '재산',
  housingType: '주거 형태',
  deposit: '보증금',
  monthlyRent: '월세',
  employmentStatus: '취업 상태',
  isSingleParent: '한부모 여부',
  childrenAges: '자녀 나이',
  hasDisability: '장애 여부',
  disabilityLevel: '장애 정도',
  isPregnant: '임신·출산 여부',
  receivingPrograms: '현재 받고 있는 제도',
  region: '거주 지역',
  basicLivelihoodType: '기초생활수급 구분',
  householdIncomePct: '중위소득 대비 비율',
};

export function fieldLabel(field: string): string {
  return FIELD_LABEL[field] ?? field;
}

/**
 * 한국어 조사를 받침에 맞춰 고른다.
 *
 * "자녀 나이을(를)" 처럼 괄호로 도망가지 않는다. 복지 안내문에서 그런 표기는
 * 읽는 사람을 한 번 멈칫하게 만든다.
 *
 * 한글 음절은 0xAC00 부터 28개 종성 주기로 배열된다 — 나머지가 0 이면 받침이 없다.
 * 한글이 아닌 글자(영문·숫자)로 끝나면 판단할 수 없으므로 받침 있는 쪽을 쓴다.
 */
export function josa(word: string, withBatchim: string, withoutBatchim: string): string {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    return (code - 0xac00) % 28 === 0 ? withoutBatchim : withBatchim;
  }
  return withBatchim;
}

/** "월 소득, 자녀 나이를" — 목록을 조사까지 붙여 돌려준다 */
export function fieldListWithJosa(
  fields: string[],
  withBatchim: string,
  withoutBatchim: string,
): string {
  const text = fields.map(fieldLabel).join(', ');
  return text + josa(text, withBatchim, withoutBatchim);
}

/**
 * enum 값을 사람 말로.
 *
 * ★ 근거표에 `LOST_JOB`, `= EMPLOYED` 같은 코드가 그대로 보이면 안 된다.
 *   화면은 사람이 읽는 곳이고, 코드는 필드명 열에만 남긴다.
 *   모르는 코드는 원래 값을 그대로 보여준다 — 조용히 숨기면 원인을 못 찾는다.
 */
const ENUM_LABEL: Record<string, Record<string, string>> = {
  housingType: {
    MONTHLY_RENT: '월세',
    JEONSE: '전세',
    OWNED: '자가',
    PUBLIC_LEASE: '공공임대',
    FREE_USE: '무상거주',
    OTHER: '그 밖',
  },
  employmentStatus: {
    EMPLOYED: '재직',
    SELF_EMPLOYED: '자영업',
    LOST_JOB: '실직',
    UNEMPLOYED: '미취업',
    STUDENT: '학생',
    RETIRED: '은퇴',
    ON_LEAVE: '휴직',
    OTHER: '그 밖',
  },
  disabilityLevel: { SEVERE: '심한 장애', MILD: '심하지 않은 장애' },
  basicLivelihoodType: {
    LIVELIHOOD: '생계급여',
    MEDICAL: '의료급여',
    HOUSING: '주거급여',
    EDUCATION: '교육급여',
    NONE: '받고 있지 않음',
  },
};

/** 필드를 아는 경우에만 enum 을 번역한다. 숫자·불리언은 그대로 통과 */
function enumLabel(field: string | undefined, v: unknown): string | null {
  if (!field || typeof v !== 'string') return null;
  return ENUM_LABEL[field]?.[v] ?? null;
}

/**
 * 조건의 비교 기준을 한 줄로. "≤ 600,000", "19 ~ 34"
 *
 * 근거표에서 "입력값" 옆에 놓여 왜 그렇게 판정됐는지를 눈으로 잇는다.
 */
export function criterion(op: string, value: unknown, field?: string): string {
  const v = (x: unknown) =>
    enumLabel(field, x) ?? (typeof x === 'number' ? comma(x) : String(x));

  switch (op) {
    case 'between':
      return Array.isArray(value) ? `${v(value[0])} ~ ${v(value[1])}` : '범위';
    case 'lte':
      return `≤ ${v(value)}`;
    case 'gte':
      return `≥ ${v(value)}`;
    case 'eq':
      return `= ${v(value)}`;
    case 'in':
      return Array.isArray(value) ? value.map(v).join(' 또는 ') : `= ${v(value)}`;
    case 'contains':
      return `${v(value)} 포함`;
    case 'exists':
      return '값이 있을 것';
    default:
      return op;
  }
}

/**
 * 조건 판정에 쓰인 실제 입력값을 표기한다.
 *
 * ★ undefined 는 "0" 이 아니라 "모름" 이다. 이 구분이 서비스의 신뢰를 만든다.
 */
export function actualLabel(
  actual: unknown,
  field?: string,
): { text: string; known: boolean } {
  if (actual === undefined || actual === null) {
    return { text: '모름', known: false };
  }
  const named = enumLabel(field, actual);
  if (named) return { text: named, known: true };
  if (typeof actual === 'boolean') {
    return { text: actual ? '예' : '아니오', known: true };
  }
  if (typeof actual === 'number') {
    // 파생값(중위소득 비율)은 소수가 길게 흘러나온다. 백엔드가 사유 문구에
    // 쓰는 자릿수(소수 1자리)와 맞춘다 — 표와 사유의 숫자가 달라 보이면 안 된다.
    return {
      text: Number.isInteger(actual) ? comma(actual) : pct(actual),
      known: true,
    };
  }
  if (Array.isArray(actual)) {
    return {
      text: actual.length === 0 ? '없음' : actual.join(', '),
      known: true,
    };
  }
  return { text: String(actual), known: true };
}
