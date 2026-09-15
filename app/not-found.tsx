import CtaLink from '@/components/CtaLink';

/**
 * 없는 주소로 들어왔을 때.
 *
 * Next 기본 화면은 영어("This page could not be found.")라 이 서비스를 쓰는
 * 사람에게 아무 말도 해 주지 않는다. 길을 잃었어도 다시 시작할 곳을 바로 준다.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col items-start gap-5 px-5 py-20 md:py-28">
      <p className="text-[0.8rem] font-medium text-warm-strong">찾는 화면이 없습니다</p>
      <h1 className="font-serif text-[clamp(1.8rem,5vw,2.4rem)] leading-snug font-bold tracking-[-0.035em]">
        길을 잘못 드셨어요.
        <br />
        처음부터 같이 찾아요.
      </h1>
      <p className="text-[1rem] leading-relaxed text-muted">
        주소가 바뀌었거나 잘못 입력된 것 같습니다. 아래 버튼을 누르시면 상황을 알려주시는 화면으로
        갑니다.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <CtaLink href="/start">내 상황 입력하기</CtaLink>
        <CtaLink href="/" tone="quiet" size="md">
          처음 화면으로
        </CtaLink>
      </div>
    </main>
  );
}
