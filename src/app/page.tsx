import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center font-bold text-black text-sm">
            M
          </div>
          <span className="text-lg font-bold">MangoI Video</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/lobby"
            className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-black font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
          >
            수업 시작하기
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl font-bold mb-4 leading-tight">
          <span className="text-[var(--color-primary)]">MangoI</span> 화상영어
        </h1>
        <p className="text-xl text-[var(--color-text-muted)] mb-8 max-w-2xl">
          WebRTC 기반 실시간 화상영어 솔루션. 화상 통화, 판서, 채팅, 녹화까지
          하나의 플랫폼에서 모두 제공합니다.
        </p>
        <div className="flex gap-4 mb-16">
          <Link
            href="/lobby"
            className="px-8 py-3 rounded-lg bg-[var(--color-primary)] text-black font-semibold text-lg hover:bg-[var(--color-primary-light)] transition-colors"
          >
            수업 시작하기
          </Link>
          <Link
            href="/lobby?mode=demo"
            className="px-8 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text)] font-semibold text-lg hover:bg-[var(--color-bg-elevated)] transition-colors"
          >
            데모 체험
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl w-full">
          <FeatureCard
            icon="📹"
            title="화상 통화"
            description="1:1 및 그룹 실시간 영상 통화"
          />
          <FeatureCard
            icon="✏️"
            title="판서 기능"
            description="실시간 화이트보드로 수업 보조"
          />
          <FeatureCard
            icon="💬"
            title="메신저"
            description="수업 중 실시간 텍스트 채팅"
          />
          <FeatureCard
            icon="⏺️"
            title="녹화 기능"
            description="수업 녹화 및 다운로드"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-[var(--color-border)] text-center text-sm text-[var(--color-text-muted)]">
        MangoI Video &copy; 2026
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-left">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
    </div>
  );
}
