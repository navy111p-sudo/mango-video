"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Recording {
  id: number;
  room_id: string;
  room_type: string;
  user_name: string;
  file_size: number;
  duration_sec: number;
  session_num: number;
  created_at: number;
}

interface GroupedRecordings {
  date: string;
  recordings: Recording[];
}

export default function RecordingsPage() {
  return (
    <Suspense>
      <RecordingsContent />
    </Suspense>
  );
}

function RecordingsContent() {
  const searchParams = useSearchParams();
  const userName = searchParams.get("name") || "";

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [inputName, setInputName] = useState(userName);
  const [activeName, setActiveName] = useState(userName);

  const fetchRecordings = useCallback(async (name: string) => {
    if (!name) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/recordings?userName=${encodeURIComponent(name)}`);
      const data = (await res.json()) as { recordings: Recording[] };
      setRecordings(data.recordings || []);
    } catch {
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeName) {
      fetchRecordings(activeName);
    } else {
      setLoading(false);
    }
  }, [activeName, fetchRecordings]);

  const handleSearch = () => {
    setActiveName(inputName);
  };

  // Group recordings by date
  const grouped: GroupedRecordings[] = [];
  const dateMap = new Map<string, Recording[]>();
  for (const rec of recordings) {
    const date = new Date(rec.created_at * 1000).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    if (!dateMap.has(date)) {
      dateMap.set(date, []);
    }
    dateMap.get(date)!.push(rec);
  }
  for (const [date, recs] of dateMap) {
    grouped.push({ date, recordings: recs });
  }

  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec}초`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}분 ${s}초` : `${m}분`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const roomTypeLabels: Record<string, string> = {
    class: "1:1 영어 회화",
    demo: "데모 체험",
    observe: "관찰 수업",
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center font-bold text-black text-sm">
            M
          </div>
          <span className="text-lg font-bold">MangoI Video</span>
        </Link>
        <Link
          href="/lobby"
          className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-black font-semibold hover:bg-[var(--color-primary-light)] transition-colors text-sm"
        >
          수업 시작하기
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">녹화본 복습 — 지난수업 다시보기</h1>

        {/* User search */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="이름을 입력하세요"
            className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 rounded-lg bg-[var(--color-primary)] text-black font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
          >
            검색
          </button>
        </div>

        {!activeName && (
          <p className="text-center text-[var(--color-text-muted)] py-16">
            이름을 입력하고 검색하면 녹화본을 볼 수 있습니다.
          </p>
        )}

        {activeName && loading && (
          <p className="text-center text-[var(--color-text-muted)] py-16">
            불러오는 중...
          </p>
        )}

        {activeName && !loading && recordings.length === 0 && (
          <p className="text-center text-[var(--color-text-muted)] py-16">
            녹화된 수업이 없습니다.
          </p>
        )}

        {activeName && !loading && recordings.length > 0 && (
          <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              {activeName} 학생 본인 수업 녹화 (총 {recordings.length}개)
            </p>

            {/* Video player */}
            {playingId && (
              <div className="mb-6 rounded-xl overflow-hidden bg-black">
                <video
                  key={playingId}
                  controls
                  autoPlay
                  className="w-full max-h-[400px]"
                  src={`/api/recordings/${playingId}`}
                />
                <div className="flex justify-end p-2 bg-[var(--color-bg-card)]">
                  <button
                    onClick={() => setPlayingId(null)}
                    className="px-3 py-1 text-sm rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}

            {/* Grouped list */}
            <div className="space-y-6">
              {grouped.map((group) => (
                <div key={group.date}>
                  <h2 className="text-sm font-semibold text-[var(--color-primary)] mb-3">
                    {group.date}
                  </h2>
                  <div className="space-y-2">
                    {group.recordings.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]"
                      >
                        {/* Play icon */}
                        <button
                          onClick={() => setPlayingId(rec.id)}
                          className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center hover:bg-[var(--color-primary-light)] transition-colors"
                        >
                          <span className="text-black text-lg ml-0.5">&#9654;</span>
                        </button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-1">
                            <span>{new Date(rec.created_at * 1000).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>
                            <span>·</span>
                            <span>{formatDuration(rec.duration_sec)}</span>
                          </div>
                          <p className="font-semibold text-sm truncate">
                            방 {rec.room_id} — {roomTypeLabels[rec.room_type] || rec.room_type} ({rec.session_num}회차)
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            강사: {rec.user_name} · {formatFileSize(rec.file_size)}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => setPlayingId(rec.id)}
                            className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-black text-xs font-semibold hover:bg-[var(--color-primary-light)] transition-colors"
                          >
                            &#9654; 시청
                          </button>
                          <a
                            href={`/api/recordings/${rec.id}`}
                            download
                            className="px-3 py-1.5 rounded-lg bg-[var(--color-bg-elevated)] text-[var(--color-text)] text-xs font-semibold hover:bg-[var(--color-border)] transition-colors"
                          >
                            &#8595; 다운
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-[var(--color-text-muted)] mt-6 text-center">
              ※ 녹화본은 수업 종료 후 자동으로 업로드됩니다.
              <br />
              ※ 본인 수업 녹화만 시청할 수 있으며, 1달간 보관됩니다.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
