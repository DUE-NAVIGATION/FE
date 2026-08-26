/**
 * 하단 고정 고지.
 *
 * CLAUDE.md 원칙 3 — 단정하지 않는다.
 * 모든 화면에 항상 노출된다. 제거하지 말 것.
 */
export default function Disclaimer() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm text-muted">
        <p>실제 수급 여부는 관할 기관의 심사로 결정됩니다.</p>
        <p className="rounded-full border border-border bg-background px-3 py-0.5 font-medium">
          입력한 내용은 어디에도 저장되지 않습니다
        </p>
      </div>
    </footer>
  );
}
