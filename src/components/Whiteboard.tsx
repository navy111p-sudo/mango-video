"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface WhiteboardProps {
  isVisible: boolean;
}

type Tool = "pen" | "eraser";

export default function Whiteboard({ isVisible }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#ffffff");
  const [lineWidth, setLineWidth] = useState(3);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * canvas.width,
        y: ((e.clientY - rect.top) / rect.height) * canvas.height,
      };
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const point = getCanvasPoint(e);
      if (!point) return;
      setIsDrawing(true);
      lastPosRef.current = point;
    },
    [getCanvasPoint]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !lastPosRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const point = getCanvasPoint(e);
      if (!ctx || !point) return;

      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(point.x, point.y);
      ctx.strokeStyle = tool === "eraser" ? "#1e293b" : color;
      ctx.lineWidth = tool === "eraser" ? lineWidth * 5 : lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      lastPosRef.current = point;
    },
    [isDrawing, tool, color, lineWidth, getCanvasPoint]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPosRef.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  if (!isVisible) return null;

  const colors = ["#ffffff", "#ef4444", "#22c55e", "#3b82f6", "#eab308", "#a855f7"];

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-border)]">
        <span className="text-sm font-semibold">판서</span>
        <div className="h-4 w-px bg-[var(--color-border)]" />

        {/* Tool buttons */}
        <button
          onClick={() => setTool("pen")}
          className={`px-3 py-1 rounded text-xs font-medium ${
            tool === "pen"
              ? "bg-[var(--color-primary)] text-black"
              : "bg-[var(--color-bg-elevated)] text-[var(--color-text)]"
          }`}
        >
          펜
        </button>
        <button
          onClick={() => setTool("eraser")}
          className={`px-3 py-1 rounded text-xs font-medium ${
            tool === "eraser"
              ? "bg-[var(--color-primary)] text-black"
              : "bg-[var(--color-bg-elevated)] text-[var(--color-text)]"
          }`}
        >
          지우개
        </button>

        <div className="h-4 w-px bg-[var(--color-border)]" />

        {/* Colors */}
        <div className="flex gap-1">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setTool("pen");
              }}
              className={`w-5 h-5 rounded-full border-2 ${
                color === c && tool === "pen"
                  ? "border-[var(--color-primary)]"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="h-4 w-px bg-[var(--color-border)]" />

        {/* Line width */}
        <input
          type="range"
          min={1}
          max={10}
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="w-20"
        />

        <div className="ml-auto">
          <button
            onClick={clearCanvas}
            className="px-3 py-1 rounded text-xs font-medium bg-[var(--color-danger)] text-white"
          >
            전체 지우기
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-full cursor-crosshair"
        />
      </div>
    </div>
  );
}
