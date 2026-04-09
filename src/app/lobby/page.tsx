"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type RoomType = "class" | "demo" | "observe";

export default function LobbyPage() {
  return (
    <Suspense>
      <LobbyContent />
    </Suspense>
  );
}

function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode");

  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomType, setRoomType] = useState<RoomType>(
    initialMode === "demo" ? "demo" : "class"
  );
  const [isCreating, setIsCreating] = useState(false);

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = () => {
    if (!userName.trim()) return;
    const newRoomId = generateRoomId();
    router.push(
      `/room/${newRoomId}?name=${encodeURIComponent(userName)}&type=${roomType}&role=host`
    );
  };

  const handleJoinRoom = () => {
    if (!userName.trim() || !roomId.trim()) return;
    router.push(
      `/room/${roomId.toUpperCase()}?name=${encodeURIComponent(userName)}&type=${roomType}&role=guest`
    );
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
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-8 text-center">수업 로비</h1>

          {/* Name input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              이름
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {/* Room type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
              방 유형
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "class", label: "수업" },
                { value: "demo", label: "데모" },
                { value: "observe", label: "관찰" },
              ] as const).map((type) => (
                <button
                  key={type.value}
                  onClick={() => setRoomType(type.value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    roomType === type.value
                      ? "bg-[var(--color-primary)] text-black"
                      : "bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)]"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle create / join */}
          <div className="flex mb-6 bg-[var(--color-bg-card)] rounded-lg p-1">
            <button
              onClick={() => setIsCreating(true)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                isCreating
                  ? "bg-[var(--color-primary)] text-black"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              방 만들기
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                !isCreating
                  ? "bg-[var(--color-primary)] text-black"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              방 참여하기
            </button>
          </div>

          {isCreating ? (
            <button
              onClick={handleCreateRoom}
              disabled={!userName.trim()}
              className="w-full py-3 rounded-lg bg-[var(--color-primary)] text-black font-semibold text-lg hover:bg-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              새 방 만들기
            </button>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="방 코드 입력 (예: A1B2C3)"
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] text-center text-lg tracking-widest uppercase"
              />
              <button
                onClick={handleJoinRoom}
                disabled={!userName.trim() || !roomId.trim()}
                className="w-full py-3 rounded-lg bg-[var(--color-primary)] text-black font-semibold text-lg hover:bg-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                참여하기
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
