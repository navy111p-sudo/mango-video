"use client";

import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  label?: string;
  isLocal?: boolean;
}

export default function VideoPlayer({
  stream,
  muted = false,
  label,
  isLocal = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-card)]">
          <div className="w-16 h-16 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center text-2xl font-bold text-[var(--color-text-muted)]">
            {label?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
        </div>
      )}
      {label && (
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
          {label}
          {isLocal && " (나)"}
        </div>
      )}
    </div>
  );
}
