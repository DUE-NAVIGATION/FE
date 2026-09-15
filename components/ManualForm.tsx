'use client';

/**
 * 직접 입력 폼.
 *
 * AI 를 못 쓸 때의 폴백이자, 대화형 추출 결과를 고치는 화면이기도 하다.
 * 판정은 AI 없이도 완전히 동작한다 — 이 폼이 그 사실을 증명한다.
 *
 * ★★ 빈 칸은 `undefined` 로 보낸다. 0 이나 false 로 채우지 않는다.
 *    0 은 "0원"이고 undefined 는 "모름"이다. 이 구분이 UNKNOWN 판정을
 *    만들고, UNKNOWN 이 있어야 "확인필요"가 "미해당"과 갈라진다.
 */

import type {
  BasicLivelihoodType,
  EmploymentStatus,
  HousingType,
  UserContext,
} from '@/types';

const HOUSING: Array<[HousingType, string]> = [
  ['MONTHLY_RENT', '월세'],
  ['JEONSE', '전세'],
  ['OWNED', '자가'],
  ['PUBLIC_LEASE', '공공임대'],
  ['FREE_USE', '무상거주'],
  ['OTHER', '그 밖'],
];

const EMPLOYMENT: Array<[EmploymentStatus, string]> = [
  ['EMPLOYED', '재직'],
  ['SELF_EMPLOYED', '자영업'],
  ['LOST_JOB', '실직'],
  ['UNEMPLOYED', '미취업'],
  ['STUDENT', '학생'],
  ['RETIRED', '은퇴'],
  ['ON_LEAVE', '휴직'],
  ['OTHER', '그 밖'],
];

/**
 * 17개 시도.
 *
 * ★ 시설 판정의 1순위 조건이다. 여기가 비면 관할이 UNKNOWN 이 되어
 *   갈 수 있는 곳이 전부 "확인 필요" 로 빠진다.
 */
const SIDO: Array<[string, string]> = [
  ['서울특별시', '서울특별시'],
  ['부산광역시', '부산광역시'],
  ['대구광역시', '대구광역시'],
  ['인천광역시', '인천광역시'],
  ['광주광역시', '광주광역시'],
  ['대전광역시', '대전광역시'],
  ['울산광역시', '울산광역시'],
  ['세종특별자치시', '세종특별자치시'],
  ['경기도', '경기도'],
  ['강원특별자치도', '강원특별자치도'],
  ['충청북도', '충청북도'],
  ['충청남도', '충청남도'],
  ['전북특별자치도', '전북특별자치도'],
  ['전라남도', '전라남도'],
  ['경상북도', '경상북도'],
  ['경상남도', '경상남도'],
  ['제주특별자치도', '제주특별자치도'],
];

const BASIC_LIVELIHOOD: Array<[BasicLivelihoodType, string]> = [
  ['NONE', '받고 있지 않음'],
  ['LIVELIHOOD', '생계급여'],
  ['MEDICAL', '의료급여'],
  ['HOUSING', '주거급여'],
  ['EDUCATION', '교육급여'],
];

export default function ManualForm({
  value,
  onChange,
  districts,
}: {
  value: UserContext;
  onChange: (patch: UserContext) => void;
  /**
   * 시도 → 시군구 목록 (GET /api/regions). 있으면 시군구를 목록에서 고르게 한다.
   * ★ 자유 입력은 "수원" · "장안구" 처럼 데이터의 "수원시" 와 어긋나
   *   갈 수 있는 곳이 전부 관할 밖으로 빠진다. 목록이 없을 때만 직접 입력한다
   */
  districts?: Record<string, string[]>;
}) {
  const districtOptions = value.region ? districts?.[value.region] : undefined;

  return (
    <div className="flex flex-col gap-7">
      <Group title="사시는 곳">
        <ChoiceField
          label="시 · 도"
          value={value.region ?? ''}
          options={SIDO}
          // 시도가 바뀌면 시군구를 비운다. 다른 시도의 구가 남아 있으면 판정이 틀린다
          onChange={(v) => onChange({ region: v || undefined, district: undefined })}
        />
        {districtOptions && districtOptions.length > 0 ? (
          <ChoiceField
            label="시 · 군 · 구"
            value={value.district ?? ''}
            options={districtOptions.map((d): [string, string] => [d, d])}
            onChange={(v) => onChange({ district: v || undefined })}
          />
        ) : (
          <TextField
            label="시 · 군 · 구"
            hint="가까운 시설을 찾는 데 씁니다. 주소는 묻지 않습니다"
            placeholder="예: 관악구"
            value={value.district ?? ''}
            onChange={(v) => onChange({ district: v.trim() || undefined })}
          />
        )}
      </Group>

      <Group title="가구">
        <NumberField
          label="가구원 수"
          unit="명"
          hint="본인 포함"
          value={value.householdSize}
          onChange={(v) => onChange({ householdSize: v })}
        />
        <NumberField
          label="나이"
          unit="세"
          hint="만 나이"
          value={value.age}
          onChange={(v) => onChange({ age: v })}
        />
        <ChoiceField
          label="한부모 가구인가요"
          value={boolToChoice(value.isSingleParent)}
          options={[
            ['yes', '예'],
            ['no', '아니오'],
          ]}
          onChange={(v) => onChange({ isSingleParent: choiceToBool(v) })}
        />
        <TextField
          label="자녀 나이"
          hint="쉼표로 구분. 자녀가 없으면 '없음'"
          placeholder="예: 7, 12"
          value={childrenToText(value.childrenAges)}
          onChange={(v) => onChange({ childrenAges: textToChildren(v) })}
        />
      </Group>

      <Group title="소득과 재산">
        <NumberField
          label="월 소득"
          unit="원"
          hint="세전. 대략이어도 됩니다"
          value={value.incomeMonthly}
          onChange={(v) => onChange({ incomeMonthly: v })}
        />
        <NumberField
          label="재산 총액"
          unit="원"
          hint="집·차·예금을 합친 값"
          value={value.assets}
          onChange={(v) => onChange({ assets: v })}
        />
        <ChoiceField
          label="기초생활수급 여부"
          value={value.basicLivelihoodType ?? ''}
          options={BASIC_LIVELIHOOD}
          onChange={(v) =>
            onChange({ basicLivelihoodType: (v || undefined) as BasicLivelihoodType })
          }
        />
      </Group>

      <Group title="주거">
        <ChoiceField
          label="주거 형태"
          value={value.housingType ?? ''}
          options={HOUSING}
          onChange={(v) => onChange({ housingType: (v || undefined) as HousingType })}
        />
        <NumberField
          label="보증금"
          unit="원"
          value={value.deposit}
          onChange={(v) => onChange({ deposit: v })}
        />
        <NumberField
          label="월세"
          unit="원"
          value={value.monthlyRent}
          onChange={(v) => onChange({ monthlyRent: v })}
        />
      </Group>

      <Group title="일과 건강">
        <ChoiceField
          label="취업 상태"
          value={value.employmentStatus ?? ''}
          options={EMPLOYMENT}
          onChange={(v) =>
            onChange({ employmentStatus: (v || undefined) as EmploymentStatus })
          }
        />
        <ChoiceField
          label="장애가 있으신가요"
          value={boolToChoice(value.hasDisability)}
          options={[
            ['yes', '예'],
            ['no', '아니오'],
          ]}
          onChange={(v) => onChange({ hasDisability: choiceToBool(v) })}
        />
        <ChoiceField
          label="임신·출산 중이신가요"
          value={boolToChoice(value.isPregnant)}
          options={[
            ['yes', '예'],
            ['no', '아니오'],
          ]}
          onChange={(v) => onChange({ isPregnant: choiceToBool(v) })}
        />
      </Group>

      {/*
        ★ 가장 민감한 질문이라 선택으로 두고, 판정에는 쓰지 않는다.
          고르면 결과 맨 위에 지금 바로 이야기할 수 있는 곳이 먼저 보인다
      */}
      <Group title="지금 안전이 걱정되시나요 (선택)">
        <ChoiceField
          label="해당하는 것이 있으면 골라 주세요"
          value={value.crisisSignals?.[0] ?? ''}
          options={[
            ['SELF_HARM', '스스로를 해치고 싶은 마음이 들어요'],
            ['VIOLENCE', '누군가에게 폭력을 당하고 있어요'],
          ]}
          onChange={(v) =>
            onChange({
              crisisSignals: (v ? [v] : undefined) as UserContext['crisisSignals'],
            })
          }
        />
      </Group>
    </div>
  );
}

// ── 조각 ────────────────────────────────────────────────────

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 w-full border-b border-border pb-1.5 font-mono text-[0.68rem] tracking-[0.14em] text-faint">
        {title}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Shell({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[0.88rem] font-medium">{label}</span>
      {children}
      {hint && <span className="text-[0.8rem] text-faint">{hint}</span>}
    </label>
  );
}

const INPUT =
  'w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-[0.95rem] text-foreground placeholder:text-faint focus-visible:border-brand focus-visible:outline-offset-0';

function NumberField({
  label,
  unit,
  hint,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  hint?: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <Shell label={label} hint={hint}>
      <span className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          // ★ 빈 문자열은 undefined 로. 0 으로 바꾸지 않는다
          value={value ?? ''}
          placeholder="모름"
          onChange={(e) =>
            onChange(e.target.value === '' ? undefined : Number(e.target.value))
          }
          className={`tabular ${INPUT}`}
        />
        <span className="shrink-0 text-[0.85rem] text-muted">{unit}</span>
      </span>
    </Shell>
  );
}

function TextField({
  label,
  hint,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Shell label={label} hint={hint}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
      />
    </Shell>
  );
}

function ChoiceField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (v: string) => void;
}) {
  return (
    <Shell label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
      >
        {/* 기본값은 "모름"이다. 아무거나 골라진 채로 시작하면 안 된다 */}
        <option value="">모름</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </Shell>
  );
}

// ── 변환 ────────────────────────────────────────────────────

function boolToChoice(v?: boolean): string {
  if (v === undefined) return '';
  return v ? 'yes' : 'no';
}

function choiceToBool(v: string): boolean | undefined {
  if (v === 'yes') return true;
  if (v === 'no') return false;
  return undefined;
}

/**
 * ★ `undefined`(모름) 와 `[]`(자녀 없음) 는 다른 뜻이다.
 *   "없음" 이라고 적으면 빈 배열, 비워두면 undefined 가 된다.
 */
function childrenToText(v?: number[]): string {
  if (v === undefined) return '';
  if (v.length === 0) return '없음';
  return v.join(', ');
}

function textToChildren(s: string): number[] | undefined {
  const t = s.trim();
  if (t === '') return undefined;
  if (t === '없음' || t === '0명') return [];

  const nums = t
    .split(/[,\s]+/)
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n) && n >= 0);

  return nums.length > 0 ? nums : undefined;
}
