/**
 * 시설 화면 도우미.
 *
 * ★ 여기서 판정하지 않는다. 백엔드가 준 시설을 어떻게 보여주고 어떻게
 *   연결할지만 다룬다.
 *
 * ★ 없는 연락처를 만들어내지 않는다. 값이 비면 그 수단을 화면에서 감춘다.
 *   틀린 번호로 전화하게 만드는 것은 안내하지 않는 것보다 나쁘다.
 */

import type {
  Facility,
  FacilityContact,
  FacilityType,
  UserContext,
} from '@/types';
import { fieldLabel, josa } from '@/lib/format';

const TYPE_LABEL: Record<FacilityType, string> = {
  CHILD_CENTER: '지역아동센터',
  COMMUNITY_WELFARE: '종합사회복지관',
  ELDERLY: '노인복지관',
  DISABILITY: '장애인복지관',
  MENTAL_HEALTH: '정신건강복지센터',
  SELF_SUFFICIENCY: '지역자활센터',
  SHELTER: '쉼터·보호시설',
  SINGLE_PARENT: '한부모가족 지원시설',
  FAMILY_CENTER: '가족센터',
  JOB_CENTER: '고용복지플러스센터',
  HOTLINE: '전화 상담',
  COMMUNITY_CENTER: '행정복지센터',
  OTHER: '기타 시설',
};

export function facilityTypeLabel(t: FacilityType): string {
  return TYPE_LABEL[t] ?? '시설';
}

/** 전화 걸기. 번호에서 하이픈·공백을 떼야 일부 기기에서 제대로 걸린다 */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, '')}`;
}

/** 문자 보내기 */
export function smsHref(phone: string, body: string): string {
  return `sms:${phone.replace(/[^0-9+]/g, '')}?body=${encodeURIComponent(body)}`;
}

export function mailtoHref(
  email: string,
  subject: string,
  body: string,
): string {
  return `mailto:${email}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}

/**
 * 지도. 카카오맵 주소 검색으로 보낸다 — 한국 주소는 국내 지도가 훨씬 정확하다.
 *
 * 좌표가 있어도 주소로 검색하는 이유: 좌표가 건물 뒤편을 가리키는 경우가 있고,
 * 주소로 검색하면 지도 앱이 알아서 정문을 잡는다.
 */
export function mapHref(f: Facility): string | null {
  const addr = f.location.roadAddress || f.location.lotAddress;
  if (!addr) return null;
  return `https://map.kakao.com/?q=${encodeURIComponent(addr)}`;
}

/** 화면에 보여줄 주소. 도로명이 없으면 지번을 쓴다 */
export function addressOf(f: Facility): string | null {
  return f.location.roadAddress || f.location.lotAddress || null;
}

/**
 * 운영시간 표기.
 *
 * ★ 비어 있으면 지어내지 않는다. 대신 "전화로 확인" 이라고 말한다 —
 *   실제로 센터마다 다르고, 우리 데이터에 없는 경우가 많다.
 */
export function hoursLabel(c: FacilityContact): {
  text: string;
  known: boolean;
} {
  if (c.always) return { text: '24시간 연중무휴', known: true };
  if (c.hours) return { text: c.hours, known: true };
  return { text: '운영시간은 전화로 확인해 주세요', known: false };
}

// ────────────────────────────────────────────────────────────
// 문의 스크립트
//
// 처음 전화하는 사람이 가장 막막해하는 지점이 "뭐라고 말해야 하나" 다.
// 그래서 할 말을 미리 적어 준다.
//
// ★ 판정이 아니다. 이미 나온 판정 결과와 사용자가 적은 값을 문장으로
//   옮기는 것뿐이다. 여기서 자격을 따지지 않는다.
// ★ 이 문장은 사용자 기기에서만 나간다. 서버로 보내지 않는다 (설계 원칙 2).
// ────────────────────────────────────────────────────────────

/**
 * 사용자 상황을 한 줄로.
 *
 * ★ 넣는 항목을 최소로 유지한다. 문의에 필요한 만큼만 —
 *   나이·주민번호·정확한 소득액을 시설에 먼저 말할 이유가 없다.
 *   소득은 "얼마" 가 아니라 "확인이 필요하다" 로만 전한다.
 */
export function situationLine(ctx: UserContext): string {
  const parts: string[] = [];

  if (ctx.district) parts.push(`${ctx.district}에 살고 있습니다`);
  else if (ctx.region) parts.push(`${ctx.region}에 살고 있습니다`);

  if (ctx.householdSize !== undefined) {
    parts.push(`${ctx.householdSize}인 가구입니다`);
  }
  if (ctx.isSingleParent) parts.push('혼자 아이를 키우고 있습니다');
  if (ctx.childrenAges && ctx.childrenAges.length > 0) {
    parts.push(`자녀는 ${ctx.childrenAges.join('세, ')}세입니다`);
  }
  if (ctx.employmentStatus === 'LOST_JOB') parts.push('최근 일이 끊겼습니다');
  else if (ctx.employmentStatus === 'UNEMPLOYED') parts.push('일을 찾고 있습니다');

  if (ctx.hasDisability) parts.push('장애가 있습니다');
  if (ctx.isPregnant) parts.push('임신·출산 중입니다');

  if (parts.length === 0) return '';
  return parts.join('. ') + '.';
}

export interface Inquiry {
  subject: string;
  body: string;
}

/**
 * 문의 문구를 만든다.
 *
 * missingFields 가 있으면 "이것 때문에 확인이 필요하다" 를 질문으로 바꾼다.
 * 그래야 통화 한 번으로 끝난다 — 다시 전화하게 만들지 않는 것이 목적이다.
 */
export function buildInquiry(
  f: Facility,
  ctx: UserContext,
  missingFields: string[],
): Inquiry {
  const lines: string[] = [`안녕하세요. ${f.name}에 문의드립니다.`];

  const situation = situationLine(ctx);
  if (situation) lines.push('', situation);

  // ★ 받침에 맞춰 조사를 고른다. "센터을" 처럼 나오면 읽는 사람이 멈칫한다
  const questions: string[] = [
    `제가 ${f.name}${josa(f.name, '을', '를')} 이용할 수 있는지 알고 싶습니다.`,
  ];

  if (missingFields.length > 0) {
    questions.push(
      `${missingFields.map(fieldLabel).join(', ')} 기준이 어떻게 되는지 알려주시면 좋겠습니다.`,
    );
  }
  if (!f.documents || f.documents.length === 0) {
    questions.push('방문할 때 필요한 서류가 있으면 알려주세요.');
  }
  if (!f.contact.hours && !f.contact.always) {
    questions.push('방문 가능한 시간도 함께 알려주시면 감사하겠습니다.');
  }

  lines.push('', ...questions.map((q) => `- ${q}`));
  lines.push('', '감사합니다.');

  return {
    subject: `${f.name} 이용 문의`,
    body: lines.join('\n'),
  };
}

/**
 * 방문 전 챙길 것.
 *
 * 시설 데이터에 준비물이 있으면 그것을 쓰고, 없으면 어디서나 통하는
 * 최소한만 안내한다. ★ 시설별로 다른 서류를 지어내지 않는다.
 */
export function checklistOf(f: Facility): {
  items: string[];
  fromData: boolean;
} {
  if (f.documents && f.documents.length > 0) {
    return { items: f.documents, fromData: true };
  }
  return {
    items: ['신분증', '가족관계증명서 (가구 상황을 확인할 때 쓰입니다)'],
    fromData: false,
  };
}
