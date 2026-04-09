"use client";

import { useState, useRef, useEffect } from "react";

export interface ChatMessage {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  isLocal: boolean;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
}

export default function ChatPanel({ messages, onSend }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border)] font-semibold text-sm">
        채팅
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-sm text-[var(--color-text-muted)]">
            메시지가 없습니다
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.isLocal ? "items-end" : "items-start"}`}
          >
            <span className="text-xs text-[var(--color-text-muted)] mb-1">
              {msg.name}
            </span>
            <div
              className={`px-3 py-2 rounded-lg text-sm max-w-[85%] ${
                msg.isLocal
                  ? "bg-[var(--color-primary)] text-black"
                  : "bg-[var(--color-bg-elevated)] text-[var(--color-text)]"
              }`}
            >
              {msg.message}
            </div>
            <span className="text-xs text-[var(--color-text-muted)] mt-1">
              {new Date(msg.timestamp).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-[var(--color-border)] flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-black text-sm font-medium hover:bg-[var(--color-primary-light)] transition-colors disabled:opacity-50"
        >
          전송
        </button>
      </form>
    </div>
  );
}
