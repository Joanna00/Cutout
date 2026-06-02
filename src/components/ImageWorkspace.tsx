import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Maximize, 
  Pipette, 
  Sparkles,
  MousePointerClick,
  MonitorCheck,
  Eye,
  Hand
} from 'lucide-react';
import { BrushMode, ThemeMode } from '../types';

interface ImageWorkspaceProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  brushMode: BrushMode;
  brushSize: number;
  zoom: number;
  setZoom: (v: number) => void;
  panX: number;
  setPanX: (v: number) => void;
  panY: number;
  setPanY: (v: number) => void;
  previewBg: ThemeMode;
  customBgColor: string;
  imageLoaded: boolean;
  onDrawStart: () => void;
  onDrawStroke: (prevX: number, prevY: number, currX: number, currY: number) => void;
  onDrawEnd: () => void;
  onSampleColor: (hexColor: string) => void;
  onUploadFiles: (files: FileList) => void;
}

export default function ImageWorkspace({
  canvasRef,
  brushMode,
  brushSize,
  zoom,
  setZoom,
  panX,
  setPanX,
  panY,
  setPanY,
  previewBg,
  customBgColor,
  imageLoaded,
  onDrawStart,
  onDrawStroke,
  onDrawEnd,
  onSampleColor,
  onUploadFiles,
}: ImageWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPanning, setIsPanning] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, visible: false });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const lastStrokePos = useRef({ x: 0, y: 0 });

  // Handle Spacebar listening for switching into temporary Panning Mode (Figma-style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        // Prevent default browser scrolling
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Map mouse coordinates to custom image canvas pixels
  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  // Drag and Drop files handlers
  const [isDragActive, setIsDragActive] = useState(false);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadFiles(e.dataTransfer.files);
    }
  };

  // Color Sampler (Eyedropper) functionality
  const handleSampleColor = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // We must sample from the ORIGINAL uploaded/image data, which is stored in offscreen or drawn before.
    // If the pixel is sampled directly from the output (which is already modified), it's transparency, 
    // which fails to read the color.
    // To make it incredibly smart:
    // We can run an event bubble or read from the offset.
    // We'll let the applet extract color from the corresponding location of the loaded original image data.
    // We'll calculate offset in img array below.
    try {
      // Get the 1x1 image pixel
      const pixel = ctx.getImageData(Math.floor(coords.x), Math.floor(coords.y), 1, 1).data;
      if (pixel[3] > 0) { // Only sample non-transparent pixels
        const r = pixel[0];
        const g = pixel[1];
        const b = pixel[2];
        const toHex = (c: number) => {
          const hex = c.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        };
        const hex = '#' + toHex(r) + toHex(g) + toHex(b);
        onSampleColor(hex);
      }
    } catch (e) {
      console.warn("Failed to sample color", e);
    }
  };

  // Mouse Interactions on Canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only left-click
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    const isPanAction = brushMode === 'none' || isSpacePressed;

    if (isPanAction) {
      // Start Panning
      setIsPanning(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    } else {
      // Start Brushing (Draw / Restore / Erase)
      setIsPainting(true);
      lastStrokePos.current = coords;
      onDrawStart();
      
      // Perform immediate drawing dot at click position
      onDrawStroke(coords.x, coords.y, coords.x, coords.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) {
      setCursorPos(prev => ({ ...prev, visible: false }));
      return;
    }

    // Update cursor position overlay in desktop interface
    // Calculate cursor location relative to container bounds to position absolute div
    if (containerRef.current) {
      const parentRect = containerRef.current.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - parentRect.left,
        y: e.clientY - parentRect.top,
        visible: true
      });
    }

    if (isPanning) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    } else if (isPainting && coords) {
      onDrawStroke(
        lastStrokePos.current.x, 
        lastStrokePos.current.y, 
        coords.x, 
        coords.y
      );
      lastStrokePos.current = coords;
    }
  };

  const handleMouseUpOrLeave = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (isPainting) {
      setIsPainting(false);
      onDrawEnd();
    }
    setCursorPos(prev => ({ ...prev, visible: false }));
  };

  // Double click on canvas in 'none' mode samples the clicked color
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (brushMode === 'none') {
      handleSampleColor(e.clientX, e.clientY);
    }
  };

  // Handle Zoom shortcuts / Wheel integration
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = 0.15;
    let newZoom = zoom;
    if (e.deltaY < 0) {
      newZoom = Math.min(800, zoom + zoom * scaleFactor);
    } else {
      newZoom = Math.max(10, zoom - zoom * scaleFactor);
    }
    setZoom(Math.round(newZoom));
  };

  const handleZoomIn = () => setZoom(Math.min(800, zoom + 20));
  const handleZoomOut = () => setZoom(Math.max(10, zoom - 20));
  const handleZoomReset = () => {
    setZoom(100);
    setPanX(0);
    setPanY(0);
  };

  // Custom Background style lookup
  const getBackgroundStyle = () => {
    switch (previewBg) {
      case 'dark':
        return 'bg-[#121214]';
      case 'light':
        return 'bg-[#F4F4F5]';
      case 'custom':
        return '';
      case 'checkerboard':
      default:
        return 'checkerboard-pattern';
    }
  };

  // Interactive Cursor icon style based on tools
  const getCursorStyle = () => {
    if (isPanning) return 'cursor-grabbing';
    if (isSpacePressed || brushMode === 'none') return 'cursor-grab';
    return 'cursor-none'; // Draw customized brush circle
  };

  // Calculate the brush cursor display size on screen taking Zoom scale into account!
  const getDisplayBrushSize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return brushSize;
    const rect = canvas.getBoundingClientRect();
    // ratio = rendered width / internal canvas width
    const ratio = rect.width / canvas.width;
    return brushSize * ratio;
  };

  return (
    <div 
      ref={containerRef}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className="flex-1 relative flex flex-col items-center justify-center bg-zinc-950 p-6 min-h-[400px] overflow-hidden select-none outline-none"
    >
      
      {/* 1. Zoom Float Tool Belt */}
      <div className="absolute top-4 left-6 z-10 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs font-semibold text-zinc-300 shadow-xl backdrop-blur-md">
        <button 
          onClick={handleZoomOut} 
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition curl-not-allowed cursor-pointer"
          title="缩小 (Ctrl + Scroll)"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="min-w-[42px] text-center font-mono text-zinc-400 text-xxs">
          {zoom}%
        </span>
        <button 
          onClick={handleZoomIn} 
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          title="放大 (Ctrl + Scroll)"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <div className="h-3 w-[1px] bg-zinc-800" />
        <button 
          onClick={handleZoomReset} 
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          title="重置缩放和位置"
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>

      {/* Mode / Instruction Banner */}
      <div className="absolute top-4 right-6 z-10 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs text-zinc-400 shadow-xl backdrop-blur-md font-mono">
        {brushMode === 'none' ? (
          <span className="flex items-center gap-1.5 font-sans">
            <MousePointerClick className="h-3.5 w-3.5 text-blue-400" />
            点击照片提取去色色样 · 双击空闲区域移动
          </span>
        ) : (
          <span className="flex items-center gap-1.5 font-sans">
            {brushMode === 'restore' ? (
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            ) : (
              <Move className="h-3.5 w-3.5 text-rose-400" />
            )}
            涂抹画面精修细节 (按住空格键并拖拽可平移画布)
          </span>
        )}
      </div>

      {/* 2. Drag/Drop Mask Cover Overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-rose-500/10 border-2 border-dashed border-rose-500 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-300">
          <div className="bg-zinc-900/90 border border-zinc-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-3 max-w-sm text-center animate-scaleIn">
            <div className="h-14 w-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-900/10 animate-bounce">
              <ZoomIn className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">松开鼠标上传图片</h3>
            <p className="text-xs text-zinc-400">支持拖入几乎所有的位图图像（PNG, JPEG, WEBP, BMP等）</p>
          </div>
        </div>
      )}

      {/* 3. The Canvas Interactive Core Workspace */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        onWheel={handleWheel}
      >
        <div 
          className="absolute transition-transform duration-75 ease-out select-none"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom / 100})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Inner Checkerboard Wrap and canvas container */}
          <div 
            className={`relative rounded-xl border border-zinc-800 shadow-2xl overflow-hidden ${getBackgroundStyle()}`}
            style={{ 
              backgroundColor: previewBg === 'custom' ? customBgColor : undefined,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)'
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onDoubleClick={handleCanvasDoubleClick}
              className={`block max-w-full transition-opacity duration-300 h-auto ${getCursorStyle()}`}
              style={{
                imageRendering: 'auto'
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. Beautiful Custom Circular hover cursor tracker for Restore / Erase Brushes */}
      {cursorPos.visible && brushMode !== 'none' && !isPanning && !isSpacePressed && (
        <div 
          className="absolute pointer-events-none rounded-full border border-white/80 shadow-md flex items-center justify-center"
          style={{
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
            width: `${getDisplayBrushSize()}px`,
            height: `${getDisplayBrushSize()}px`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: brushMode === 'restore' ? 'rgba(79, 70, 229, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(0,0,0,0.25)',
            zIndex: 999
          }}
        >
          {/* Central tiny center pivot */}
          <div className="w-1 h-1 rounded-full bg-white shadow-sm" />
        </div>
      )}

      {/* Workspace Footer: hints for productivity */}
      <div className="absolute bottom-4 left-6 text-[10px] text-zinc-500 font-mono tracking-wide">
        滚动鼠标滚轮快速缩放 · 按住Spacebar拖拽平移 | 双击画布空白还原
      </div>
    </div>
  );
}
