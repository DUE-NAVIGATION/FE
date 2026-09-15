'use client';

/**
 * 글자 크게 보기. ★ 고령자도 사용자다.
 *
 * <html> 에 data-size="large" 를 붙이면 globals.css 가 기본 글자를 18px → 21px 로 키운다.
 * 화면 전체가 rem 기준이라 버튼·여백까지 함께 커진다.
 *
 * ★ 저장하지 않는다 (설계 원칙 2). 새로고침하면 보통 크기로 돌아온다.
 *   누가 이 기기를 쓰는지 흔적을 남기지 않는 쪽을 택했다.
 */

import { useState } from 'react';

export default function TextSizeToggle() {
  const [large, setLarge] = useState(false);

  function toggle() {
    const next = !large;
    setLarge(next);
    if (next) document.documentElement.dataset.size = 'large';
    else delete document.documentElement.dataset.size;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={large}
      aria-label={large ? '글자 보통 크기로' : '글자 크게 보기'}
      className={`rounded-full px-3 py-2 text-[0.82rem] font-semibold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        large ? 'bg-foreground text-white' : 'text-muted hover:bg-[rgba(120,80,45,0.06)]'
      }`}
    >
      가<span className="text-[1.15em]">+</span>
      <span className="ml-1 hidden sm:inline">{large ? '보통 글자' : '글자 크게'}</span>
    </button>
  );
}
