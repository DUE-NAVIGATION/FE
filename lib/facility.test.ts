import { describe, expect, it } from 'vitest';
import {
  addressOf,
  buildInquiry,
  checklistOf,
  hoursLabel,
  mapHref,
  situationLine,
  telHref,
} from './facility';
import { displayStatus } from './format';
import type { Facility, UserContext } from '@/types';

function facility(over: Partial<Facility> = {}): Facility {
  return {
    id: 'test',
    name: '관악구정신건강복지센터',
    type: 'MENTAL_HEALTH',
    eligibility: {},
    coverage: { scope: 'SIGUNGU', sido: '서울특별시', sigungu: '관악구' },
    location: {
      sido: '서울특별시',
      sigungu: '관악구',
      roadAddress: '서울특별시 관악구 관악로 145',
    },
    contact: { phone: '02-879-4911' },
    source: { url: '', revisedAt: '2026-09-10' },
    ...over,
  };
}

describe('telHref', () => {
  it('하이픈을 떼야 일부 기기에서 걸린다', () => {
    expect(telHref('02-879-4911')).toBe('tel:028794911');
  });

  it('단축번호도 그대로', () => {
    expect(telHref('129')).toBe('tel:129');
  });
});

describe('hoursLabel', () => {
  // ★ 없는 운영시간을 지어내지 않는다. 이게 이 서비스의 신뢰다
  it('비어 있으면 전화로 확인하라고 말한다', () => {
    const got = hoursLabel({});
    expect(got.known).toBe(false);
    expect(got.text).toContain('전화로 확인');
  });

  it('24시간은 그것부터 알린다', () => {
    expect(hoursLabel({ always: true, hours: '평일만' })).toEqual({
      text: '24시간 연중무휴',
      known: true,
    });
  });

  it('있으면 그대로 쓴다', () => {
    expect(hoursLabel({ hours: '평일 09:00~18:00' })).toEqual({
      text: '평일 09:00~18:00',
      known: true,
    });
  });
});

describe('mapHref / addressOf', () => {
  it('주소가 없으면 지도 링크를 만들지 않는다', () => {
    const f = facility({
      location: { sido: '', sigungu: '', roadAddress: '' },
    });
    expect(mapHref(f)).toBeNull();
    expect(addressOf(f)).toBeNull();
  });

  it('도로명이 없으면 지번을 쓴다', () => {
    const f = facility({
      location: {
        sido: '서울특별시',
        sigungu: '종로구',
        roadAddress: '',
        lotAddress: '서울특별시 종로구 사직동 1-1',
      },
    });
    expect(addressOf(f)).toBe('서울특별시 종로구 사직동 1-1');
    expect(mapHref(f)).toContain(encodeURIComponent('사직동'));
  });
});

describe('situationLine', () => {
  it('적힌 것만 넣는다', () => {
    const ctx: UserContext = {
      district: '관악구',
      householdSize: 2,
      isSingleParent: true,
      childrenAges: [7],
      employmentStatus: 'LOST_JOB',
    };
    const got = situationLine(ctx);
    expect(got).toContain('관악구에 살고 있습니다');
    expect(got).toContain('2인 가구입니다');
    expect(got).toContain('혼자 아이를 키우고 있습니다');
    expect(got).toContain('자녀는 7세입니다');
    expect(got).toContain('최근 일이 끊겼습니다');
  });

  // ★ 시설에 먼저 말할 이유가 없는 것은 넣지 않는다
  it('소득액과 나이는 넣지 않는다', () => {
    const got = situationLine({ incomeMonthly: 2_000_000, age: 33 });
    expect(got).not.toContain('2000000');
    expect(got).not.toContain('2,000,000');
    expect(got).not.toContain('33');
  });

  it('아무것도 없으면 빈 문자열', () => {
    expect(situationLine({})).toBe('');
  });
});

describe('buildInquiry', () => {
  // ★ "센터을" 처럼 나오면 읽는 사람이 멈칫한다
  it('받침에 맞춰 조사를 고른다 — 받침 없음', () => {
    const got = buildInquiry(facility(), {}, []);
    expect(got.body).toContain('관악구정신건강복지센터를 이용할 수 있는지');
    expect(got.body).not.toContain('센터을');
  });

  it('받침에 맞춰 조사를 고른다 — 받침 있음', () => {
    const got = buildInquiry(facility({ name: '서울시립복지관' }), {}, []);
    expect(got.body).toContain('서울시립복지관을 이용할 수 있는지');
  });

  it('확인이 필요한 항목을 질문으로 바꾼다', () => {
    const got = buildInquiry(facility(), {}, ['incomeMonthly', 'assets']);
    expect(got.body).toContain('월 소득');
    expect(got.body).toContain('재산');
  });

  it('운영시간을 아는 시설에는 시간을 묻지 않는다', () => {
    const known = buildInquiry(
      facility({ contact: { phone: '02-1', hours: '평일 09:00~18:00' } }),
      {},
      [],
    );
    expect(known.body).not.toContain('방문 가능한 시간');

    const unknown = buildInquiry(facility(), {}, []);
    expect(unknown.body).toContain('방문 가능한 시간');
  });

  it('준비물이 적힌 시설에는 서류를 묻지 않는다', () => {
    const withDocs = buildInquiry(
      facility({ documents: ['신분증', '주민등록등본'] }),
      {},
      [],
    );
    expect(withDocs.body).not.toContain('필요한 서류가 있으면');
  });

  it('제목에 시설명이 들어간다', () => {
    expect(buildInquiry(facility(), {}, []).subject).toContain(
      '관악구정신건강복지센터',
    );
  });
});

describe('checklistOf', () => {
  it('시설 데이터가 있으면 그것을 쓴다', () => {
    const got = checklistOf(facility({ documents: ['신분증', '임대차계약서'] }));
    expect(got.fromData).toBe(true);
    expect(got.items).toEqual(['신분증', '임대차계약서']);
  });

  // ★ 시설별로 다른 서류를 지어내지 않는다. 모른다고 밝힌다
  it('없으면 최소한만 안내하고 확인되지 않았음을 표시한다', () => {
    const got = checklistOf(facility());
    expect(got.fromData).toBe(false);
    expect(got.items.length).toBeGreaterThan(0);
  });
});

describe('displayStatus — 배제 조건 표시 뒤집기', () => {
  // ★ 화면이 조건의 뜻을 정반대로 보여주던 버그를 막는다.
  //   "재직 중이 아닐 것" 조건에서 실직자에게 붉은 FAIL 이 떴었다.
  it('none 그룹은 PASS 와 FAIL 을 뒤집는다', () => {
    expect(displayStatus({ group: 'none', status: 'FAIL' })).toBe('PASS');
    expect(displayStatus({ group: 'none', status: 'PASS' })).toBe('FAIL');
  });

  it('none 그룹이어도 UNKNOWN 은 그대로다 — 모르는 건 뒤집을 게 없다', () => {
    expect(displayStatus({ group: 'none', status: 'UNKNOWN' })).toBe('UNKNOWN');
  });

  it('나머지 그룹은 그대로 쓴다', () => {
    for (const group of ['all', 'any', 'coverage'] as const) {
      expect(displayStatus({ group, status: 'PASS' })).toBe('PASS');
      expect(displayStatus({ group, status: 'FAIL' })).toBe('FAIL');
    }
  });

  // 백엔드가 group 을 안 주는 옛 응답이 와도 화면이 깨지지 않아야 한다
  it('group 이 없으면 원래 상태를 쓴다', () => {
    expect(displayStatus({ status: 'FAIL' })).toBe('FAIL');
  });
});
