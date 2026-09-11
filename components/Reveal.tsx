'use client';

/**
 * 화면에 들어올 때 한 번 천천히 떠오른다. 첫 화면(`/`)에서만 쓴다.
 *
 * - scroll 이벤트를 쓰지 않는다. IntersectionObserver 가 브라우저에 맡긴다
 * - 한 번 보인 뒤에는 관찰을 끊는다. 다시 숨었다 나타나면 산만하다
 * - 상태(state)를 두지 않고 클래스만 붙인다. 떠오르기 하나 때문에 다시 그릴 필요가 없다
 * - 움직임 줄이기 설정이면 CSS 가 처음부터 보이게 둔다 (globals.css)
 */

import { useEffect, useRef } from 'react';

export default function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  /** 90ms 단위. 같은 줄의 카드를 차례로 띄울 때 */
  delay?: number;
  className?: string;
  as?: 'div' | 'li' | 'section';
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.classList.add('is-in');

    // 관찰기를 못 쓰는 환경이면 그냥 보여준다. 내용이 숨는 것보다 낫다
    if (typeof IntersectionObserver === 'undefined') {
      show();
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${className}`}
      style={{ '--d': delay } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
