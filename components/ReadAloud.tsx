'use client';

/**
 * 소리로 듣기 — 글 읽기가 어려운 분을 위해 문구를 읽어 준다.
 *
 * 브라우저에 들어 있는 음성 합성(speechSynthesis)을 쓴다.
 * ★ 문구가 서버나 외부 음성 서비스로 나가지 않는다. 기기 안에서만 읽는다 (설계 원칙 2).
 * 음성을 지원하지 않는 브라우저에서는 버튼을 아예 보이지 않는다.
 */

import { useEffect, useState, useSyncExternalStore } from 'react';

const noop = () => () => {};

export default function ReadAloud({ text, className = '' }: { text: string; className?: string }) {
  // 서버에서 그릴 때는 false, 브라우저에서 지원 여부를 읽는다 (hydration 불일치 없이)
  const supported = useSyncExternalStore(
    noop,
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
    () => false,
  );
  const [speaking, setSpeaking] = useState(false);

  // 화면을 떠나면 읽던 것을 멈춘다
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  if (!supported) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    synth.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.9; // 조금 천천히
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className={className}
    >
      {speaking ? '읽기 멈추기' : '소리로 듣기'}
    </button>
  );
}
