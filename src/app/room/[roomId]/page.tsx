"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import ChatPanel, { type ChatMessage } from "@/components/ChatPanel";
import Whiteboard from "@/components/Whiteboard";
import ControlBar from "@/components/ControlBar";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useRecorder } from "@/hooks/useRecorder";

export default function RoomPage() {
  return (
    <Suspense>
      <RoomContent />
    </Suspense>
  );
}

function RoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomId = params.roomId as string;
  const userName = searchParams.get("name") || "Guest";
  const roomType = searchParams.get("type") || "class";
  const role = searchParams.get("role") || "guest";

  const peerId = useMemo(
    () => Math.random().toString(36).substring(2, 10),
    []
  );

  const {
    localStream,
    peers,
    isAudioEnabled,
    isVideoEnabled,
    isConnected,
    toggleAudio,
    toggleVideo,
    sendChatMessage,
  } = useWebRTC({ roomId, userName, peerId });

  const { isRecording, startRecording, stopRecording } = useRecorder();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Listen for incoming chat messages via signaling
  useEffect(() => {
    // Chat messages arrive via the WebRTC signaling handler
    // We handle them in the signaling client's onMessage
    const handler = (e: CustomEvent<ChatMessage>) => {
      setChatMessages((prev) => [...prev, e.detail]);
    };
    window.addEventListener("chat-message" as string, handler as EventListener);
    return () =>
      window.removeEventListener(
        "chat-message" as string,
        handler as EventListener
      );
  }, []);

  const handleSendChat = useCallback(
    (message: string) => {
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        name: userName,
        message,
        timestamp: Date.now(),
        isLocal: true,
      };
      setChatMessages((prev) => [...prev, msg]);
      sendChatMessage(message);
    },
    [userName, sendChatMessage]
  );

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else if (localStream) {
      startRecording(localStream);
    }
  }, [isRecording, localStream, startRecording, stopRecording]);

  const handleLeave = useCallback(() => {
    router.push("/lobby");
  }, [router]);

  const peerList = Array.from(peers.values());

  const roomTypeLabels: Record<string, string> = {
    class: "수업",
    demo: "데모",
    observe: "관찰",
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-card)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-[var(--color-primary)] flex items-center justify-center font-bold text-black text-xs">
            M
          </div>
          <span className="font-semibold text-sm">방: {roomId}</span>
          <span className="px-2 py-0.5 rounded bg-[var(--color-bg-elevated)] text-xs text-[var(--color-text-muted)]">
            {roomTypeLabels[roomType] || roomType}
          </span>
          <span className="px-2 py-0.5 rounded bg-[var(--color-bg-elevated)] text-xs text-[var(--color-text-muted)]">
            {role === "host" ? "호스트" : "참여자"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]"}`}
          />
          <span className="text-xs text-[var(--color-text-muted)]">
            {isConnected ? "연결됨" : "연결 중..."}
          </span>
          <span className="text-xs text-[var(--color-text-muted)] ml-2">
            참여자: {peerList.length + 1}명
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Video area */}
        <div className="flex-1 flex flex-col p-4 gap-4 min-w-0">
          {isWhiteboardOpen ? (
            <div className="flex-1 min-h-0">
              <Whiteboard isVisible={isWhiteboardOpen} />
            </div>
          ) : (
            <div className="flex-1 grid gap-4 min-h-0" style={{
              gridTemplateColumns: peerList.length === 0
                ? "1fr"
                : peerList.length <= 1
                  ? "1fr 1fr"
                  : "repeat(auto-fit, minmax(300px, 1fr))",
            }}>
              {/* Local video */}
              <VideoPlayer
                stream={localStream}
                muted
                label={userName}
                isLocal
              />

              {/* Remote peers */}
              {peerList.map((peer) => (
                <VideoPlayer
                  key={peer.id}
                  stream={peer.stream}
                  label={peer.name}
                />
              ))}
            </div>
          )}

          {/* Small local video when whiteboard is open */}
          {isWhiteboardOpen && (
            <div className="flex gap-3 h-32">
              <div className="w-48">
                <VideoPlayer
                  stream={localStream}
                  muted
                  label={userName}
                  isLocal
                />
              </div>
              {peerList.map((peer) => (
                <div key={peer.id} className="w-48">
                  <VideoPlayer stream={peer.stream} label={peer.name} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat panel */}
        {isChatOpen && (
          <div className="w-80 border-l border-[var(--color-border)] p-3">
            <ChatPanel messages={chatMessages} onSend={handleSendChat} />
          </div>
        )}
      </div>

      {/* Control bar */}
      <ControlBar
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isRecording={isRecording}
        isChatOpen={isChatOpen}
        isWhiteboardOpen={isWhiteboardOpen}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleRecording={handleToggleRecording}
        onToggleChat={() => setIsChatOpen((v) => !v)}
        onToggleWhiteboard={() => setIsWhiteboardOpen((v) => !v)}
        onLeave={handleLeave}
      />
    </div>
  );
}
