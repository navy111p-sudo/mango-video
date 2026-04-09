"use client";

interface ControlBarProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isRecording: boolean;
  isChatOpen: boolean;
  isWhiteboardOpen: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleRecording: () => void;
  onToggleChat: () => void;
  onToggleWhiteboard: () => void;
  onLeave: () => void;
}

export default function ControlBar({
  isAudioEnabled,
  isVideoEnabled,
  isRecording,
  isChatOpen,
  isWhiteboardOpen,
  onToggleAudio,
  onToggleVideo,
  onToggleRecording,
  onToggleChat,
  onToggleWhiteboard,
  onLeave,
}: ControlBarProps) {
  return (
    <div className="flex items-center justify-center gap-3 px-6 py-4 bg-[var(--color-bg-card)] border-t border-[var(--color-border)]">
      {/* Audio */}
      <ControlButton
        active={isAudioEnabled}
        onClick={onToggleAudio}
        label={isAudioEnabled ? "마이크 끄기" : "마이크 켜기"}
        icon={isAudioEnabled ? "🎤" : "🔇"}
      />

      {/* Video */}
      <ControlButton
        active={isVideoEnabled}
        onClick={onToggleVideo}
        label={isVideoEnabled ? "카메라 끄기" : "카메라 켜기"}
        icon={isVideoEnabled ? "📹" : "📷"}
      />

      {/* Recording */}
      <ControlButton
        active={isRecording}
        onClick={onToggleRecording}
        label={isRecording ? "녹화 중지" : "녹화 시작"}
        icon={isRecording ? "⏹️" : "⏺️"}
        activeColor="var(--color-danger)"
      />

      <div className="w-px h-8 bg-[var(--color-border)]" />

      {/* Chat */}
      <ControlButton
        active={isChatOpen}
        onClick={onToggleChat}
        label="채팅"
        icon="💬"
      />

      {/* Whiteboard */}
      <ControlButton
        active={isWhiteboardOpen}
        onClick={onToggleWhiteboard}
        label="판서"
        icon="✏️"
      />

      <div className="w-px h-8 bg-[var(--color-border)]" />

      {/* Leave */}
      <button
        onClick={onLeave}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-danger)] text-white font-medium hover:opacity-90 transition-opacity"
      >
        <span>나가기</span>
      </button>
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  label,
  icon,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
  activeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
        active
          ? "bg-[var(--color-bg-elevated)]"
          : "bg-[var(--color-bg)] hover:bg-[var(--color-bg-elevated)]"
      }`}
      style={active && activeColor ? { backgroundColor: activeColor } : undefined}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
    </button>
  );
}
