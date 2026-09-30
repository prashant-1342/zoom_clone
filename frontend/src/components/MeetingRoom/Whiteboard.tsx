'use client';

import React, { useRef, useState, useEffect } from 'react';
import { XIcon, TrashIcon } from '@/components/Icons';

interface WhiteboardProps {
  isOpen: boolean;
  onClose: () => void;
  broadcastChannel?: BroadcastChannel | null;
  ws?: WebSocket | null;
}

type ToolType = 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'circle' | 'line';

interface DrawAction {
  tool: ToolType;
  color: string;
  size: number;
  points: { x: number; y: number }[];
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
}

export default function Whiteboard({
  isOpen,
  onClose,
  broadcastChannel,
  ws
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [activeColor, setActiveColor] = useState('#0e71eb');
  const [brushSize, setBrushSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);

  const actionsRef = useRef<DrawAction[]>([]);
  const currentActionRef = useRef<DrawAction | null>(null);

  const colors = [
    '#0e71eb',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#111827',
    '#ffffff'
  ];

  useEffect(() => {
    if (!isOpen) return;

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        redrawAll();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isOpen]);

  const redrawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    actionsRef.current.forEach(action => {
      renderAction(ctx, action);
    });
  };

  const renderAction = (ctx: CanvasRenderingContext2D, action: DrawAction) => {
    ctx.save();
    ctx.strokeStyle = action.tool === 'eraser' ? '#ffffff' : action.color;
    ctx.fillStyle = action.color;
    ctx.lineWidth = action.tool === 'highlighter' ? action.size * 3 : action.tool === 'eraser' ? action.size * 4 : action.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = action.tool === 'highlighter' ? 0.35 : 1.0;

    if (action.tool === 'pen' || action.tool === 'highlighter' || action.tool === 'eraser') {
      if (action.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(action.points[0].x, action.points[0].y);
      for (let i = 1; i < action.points.length; i++) {
        ctx.lineTo(action.points[i].x, action.points[i].y);
      }
      ctx.stroke();
    } else if (action.tool === 'rectangle' && action.startX !== undefined && action.startY !== undefined && action.endX !== undefined && action.endY !== undefined) {
      const w = action.endX - action.startX;
      const h = action.endY - action.startY;
      ctx.strokeRect(action.startX, action.startY, w, h);
    } else if (action.tool === 'circle' && action.startX !== undefined && action.startY !== undefined && action.endX !== undefined && action.endY !== undefined) {
      const rx = Math.abs(action.endX - action.startX) / 2;
      const ry = Math.abs(action.endY - action.startY) / 2;
      const cx = Math.min(action.startX, action.endX) + rx;
      const cy = Math.min(action.startY, action.endY) + ry;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (action.tool === 'line' && action.startX !== undefined && action.startY !== undefined && action.endX !== undefined && action.endY !== undefined) {
      ctx.beginPath();
      ctx.moveTo(action.startX, action.startY);
      ctx.lineTo(action.endX, action.endY);
      ctx.stroke();
    }

    ctx.restore();
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    setIsDrawing(true);

    const newAction: DrawAction = {
      tool: activeTool,
      color: activeColor,
      size: brushSize,
      points: [pos],
      startX: pos.x,
      startY: pos.y,
      endX: pos.x,
      endY: pos.y
    };

    currentActionRef.current = newAction;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentActionRef.current) return;
    const pos = getPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'eraser') {
      currentActionRef.current.points.push(pos);
      redrawAll();
      renderAction(ctx, currentActionRef.current);
    } else {
      currentActionRef.current.endX = pos.x;
      currentActionRef.current.endY = pos.y;
      redrawAll();
      renderAction(ctx, currentActionRef.current);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing || !currentActionRef.current) return;
    setIsDrawing(false);

    actionsRef.current.push(currentActionRef.current);
    currentActionRef.current = null;
  };

  const clearCanvas = () => {
    actionsRef.current = [];
    currentActionRef.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  };

  const undoLast = () => {
    actionsRef.current.pop();
    redrawAll();
  };

  const exportAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `zoom-whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-2 sm:inset-4 z-40 bg-[#1e212b] border border-gray-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 select-none">
      
      <div className="h-14 bg-[#181a22] border-b border-gray-700/80 px-4 flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Zoom Collaboration Whiteboard
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#242834] p-1 rounded-xl border border-gray-700/60 overflow-x-auto">
          <button
            onClick={() => setActiveTool('pen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTool === 'pen' ? 'bg-[#0e71eb] text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Pen
          </button>

          <button
            onClick={() => setActiveTool('highlighter')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTool === 'highlighter' ? 'bg-[#0e71eb] text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Highlighter
          </button>

          <button
            onClick={() => setActiveTool('rectangle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTool === 'rectangle' ? 'bg-[#0e71eb] text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Rectangle
          </button>

          <button
            onClick={() => setActiveTool('circle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTool === 'circle' ? 'bg-[#0e71eb] text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Circle
          </button>

          <button
            onClick={() => setActiveTool('line')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTool === 'line' ? 'bg-[#0e71eb] text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Line
          </button>

          <button
            onClick={() => setActiveTool('eraser')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTool === 'eraser' ? 'bg-[#0e71eb] text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Eraser
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={undoLast}
            className="px-2.5 py-1.5 bg-[#252936] hover:bg-[#313647] text-gray-200 text-xs font-medium rounded-lg transition"
          >
            Undo
          </button>

          <button
            onClick={clearCanvas}
            className="p-1.5 bg-[#252936] hover:bg-rose-950/60 text-gray-300 hover:text-rose-400 rounded-lg transition"
            title="Clear Board"
          >
            <TrashIcon className="w-4 h-4" />
          </button>

          <button
            onClick={exportAsImage}
            className="px-3 py-1.5 bg-[#0e71eb] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow transition"
          >
            Export PNG
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

      </div>

      <div className="h-10 bg-[#1e212b] border-b border-gray-700/60 px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 font-medium mr-1">Colors:</span>
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setActiveColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition ${
                activeColor === c ? 'scale-125 border-white shadow-md' : 'border-gray-600 hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 font-medium">Stroke:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24 accent-[#0e71eb] h-1.5 rounded-lg bg-gray-700 cursor-pointer"
          />
          <span className="text-[11px] text-gray-300 font-mono w-4">{brushSize}px</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 bg-white relative cursor-crosshair overflow-hidden touch-none"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-full block"
        />
      </div>

    </div>
  );
}
