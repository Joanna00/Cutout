import React from 'react';
import { 
  Sliders, 
  Trash2, 
  Undo2, 
  Redo2, 
  Download, 
  Upload, 
  Eraser, 
  RotateCcw,
  Palette, 
  Info,
  Sparkles,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import { BrushMode, ThemeMode } from '../types';

interface ControlPanelProps {
  tolerance: number;
  setTolerance: (v: number) => void;
  feathering: number;
  setFeathering: (v: number) => void;
  targetColor: string;
  setTargetColor: (v: string) => void;
  brushMode: BrushMode;
  setBrushMode: (mode: BrushMode) => void;
  brushSize: number;
  setBrushSize: (v: number) => void;
  previewBg: ThemeMode;
  setPreviewBg: (mode: ThemeMode) => void;
  customBgColor: string;
  setCustomBgColor: (v: string) => void;
  onDownload: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imageLoaded: boolean;
  fileName: string;
  originalWidth: number;
  originalHeight: number;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClearBrush: () => void;
  onResetSample: () => void;
}

export default function ControlPanel({
  tolerance,
  setTolerance,
  feathering,
  setFeathering,
  targetColor,
  setTargetColor,
  brushMode,
  setBrushMode,
  brushSize,
  setBrushSize,
  previewBg,
  setPreviewBg,
  customBgColor,
  setCustomBgColor,
  onDownload,
  onUpload,
  imageLoaded,
  fileName,
  originalWidth,
  originalHeight,
  undo,
  redo,
  canUndo,
  canRedo,
  onClearBrush,
  onResetSample,
}: ControlPanelProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const presetColors = [
    { name: '纯白', value: '#FFFFFF', bg: 'bg-white border-zinc-700' },
    { name: '透黑', value: '#000000', bg: 'bg-black border-zinc-700' },
    { name: '绿幕', value: '#00FF00', bg: 'bg-[#00FF00] border-zinc-700' },
  ];

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <aside className="w-full lg:w-96 flex flex-col border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900/60 backdrop-blur-md overflow-y-auto max-h-[calc(100vh-73px)] select-none">
      
      {/* 1. Upload Actions */}
      <div className="p-5 border-b border-zinc-800/80">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onUpload} 
          accept="image/*" 
          className="hidden" 
        />
        <div className="flex flex-col gap-3">
          <button
            onClick={handleUploadClick}
            id="upload_btn"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-rose-900/20 transition-all duration-300 hover:brightness-110 active:scale-98 cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            上传本地图片
          </button>
          
          <button
            onClick={onResetSample}
            id="reset_sample"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-800/30 py-2.5 px-4 text-xs font-medium text-zinc-300 transition-all hover:bg-zinc-800/60 hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重置并加载示例图片
          </button>
        </div>

        {imageLoaded && (
          <div className="mt-4 rounded-lg bg-zinc-950/60 p-3 border border-zinc-800/50">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-zinc-400 font-medium truncate" title={fileName}>
                文件名: <span className="font-mono text-zinc-300">{fileName}</span>
              </span>
              <span className="text-xs text-zinc-400 font-medium flex justify-between">
                <span>画幅分辨率:</span>
                <span className="font-mono text-amber-400 font-semibold">{originalWidth} × {originalHeight} px</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Parameters Tuning */}
      <div className="p-5 border-b border-zinc-800/80 space-y-5">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-amber-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">智能抠图参数</h2>
        </div>

        {/* Color picker */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
            <span>目标识别去色 (默认白色)</span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">{targetColor}</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 bg-zinc-950/40 p-1 rounded-lg border border-zinc-800/60">
              {presetColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setTargetColor(color.value)}
                  className={`h-6 px-2 rounded-md border text-[10px] font-medium transition-all cursor-pointer ${color.bg} ${
                    targetColor.toLowerCase() === color.value.toLowerCase() 
                      ? 'ring-2 ring-rose-500/80 border-transparent text-rose-500' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {color.name}
                </button>
              ))}
            </div>

            {/* Selector */}
            <div className="relative flex items-center gap-1.5 flex-1 min-w-0">
              <div 
                className="w-10 h-8 rounded-lg border border-zinc-800/80 cursor-pointer overflow-hidden relative flex-shrink-0"
                style={{ backgroundColor: targetColor }}
              >
                <input 
                  type="color" 
                  value={targetColor} 
                  onChange={(e) => setTargetColor(e.target.value)} 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
              <input 
                type="text" 
                value={targetColor} 
                onChange={(e) => setTargetColor(e.target.value)} 
                placeholder="#HEX"
                className="w-full h-8 px-2 rounded-lg bg-zinc-950/40 border border-zinc-800/60 focus:border-zinc-700 text-xs text-white font-mono placeholder-zinc-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tolerance */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-zinc-300">抠色容差 (Tolerance)</span>
            <span className="font-mono text-emerald-400 font-semibold">{tolerance}</span>
          </div>
          <input
            type="range"
            min="1"
            max="200"
            value={tolerance}
            onChange={(e) => setTolerance(Number(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            数值越大，被去除的白色范围拓宽。推荐白色背景设置为 30-50。
          </p>
        </div>

        {/* Feathering */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-zinc-300">边缘羽化 (Feathering)</span>
            <span className="font-mono text-cyan-400 font-semibold">{feathering} px</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={feathering}
            onChange={(e) => setFeathering(Number(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            数值越大边缘半透明过渡越柔和，能完美融合边缘白边，消除毛糙。
          </p>
        </div>
      </div>

      {/* 3. Manual Refinement */}
      <div className="p-5 border-b border-zinc-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eraser className="h-4 w-4 text-rose-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">手工细节精修</h2>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-1.5 rounded-md border transition-all ${
                canUndo 
                  ? 'border-zinc-800 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer' 
                  : 'border-zinc-800/30 text-zinc-700 cursor-not-allowed'
              }`}
              title="撤销最后一步笔迹"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-1.5 rounded-md border transition-all ${
                canRedo 
                  ? 'border-zinc-800 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer' 
                  : 'border-zinc-800/30 text-zinc-700 cursor-not-allowed'
              }`}
              title="重做保留笔迹"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 leading-normal">
          当白色衣服或镜子等高光部位被误透明时，请切换画笔在图片上涂抹涂改：
        </p>

        {/* Brush mode selectors */}
        <div className="grid grid-cols-3 gap-1 bg-zinc-950/40 p-1 rounded-xl border border-zinc-800/80">
          <button
            onClick={() => setBrushMode('none')}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-xxs font-medium transition-all cursor-pointer ${
              brushMode === 'none'
                ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            智能识别
          </button>
          <button
            onClick={() => setBrushMode('restore')}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-xxs font-medium transition-all cursor-pointer ${
              brushMode === 'restore'
                ? 'bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/50'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
            原件恢复
          </button>
          <button
            onClick={() => setBrushMode('erase')}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-xxs font-medium transition-all cursor-pointer ${
              brushMode === 'erase'
                ? 'bg-rose-600/20 text-rose-400 ring-1 ring-rose-500/50'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Eraser className="h-3.5 w-3.5 text-rose-400" />
            手动擦除
          </button>
        </div>

        {/* Brush Size */}
        {brushMode !== 'none' && (
          <div className="space-y-1.5 animate-fadeIn">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-300">画笔粗细 Size</span>
              <span className="font-mono text-zinc-400 font-semibold">{brushSize} px</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="3"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div 
                className="w-6 h-6 rounded-full border border-zinc-700 bg-white/20 flex-shrink-0 flex items-center justify-center"
                title="当前画笔大小预览"
              >
                <div 
                  className="rounded-full bg-amber-400"
                  style={{ width: `${Math.max(2, brushSize / 4)}px`, height: `${Math.max(2, brushSize / 4)}px` }}
                />
              </div>
            </div>
            <button
              onClick={onClearBrush}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-950/40 bg-rose-950/20 py-1.5 px-3 text-xxs font-medium text-rose-300 transition-all hover:bg-rose-950/40 cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              清空当前绘制的全部笔迹
            </button>
          </div>
        )}
      </div>

      {/* 4. Canvas View Settings */}
      <div className="p-5 border-b border-zinc-800/80 space-y-3">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="h-4 w-4 text-emerald-400" />
          工作区背景色
        </label>
        <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-950/40 rounded-lg border border-zinc-800/60 text-xxs">
          <button
            onClick={() => setPreviewBg('checkerboard')}
            className={`py-1.5 px-1 rounded-md text-center transition-all cursor-pointer ${
              previewBg === 'checkerboard' ? 'bg-zinc-800 text-white font-medium shadow' : 'text-zinc-500 hover:text-zinc-400'
            }`}
          >
            棋盘格
          </button>
          <button
            onClick={() => setPreviewBg('dark')}
            className={`py-1.5 px-1 rounded-md text-center transition-all cursor-pointer ${
              previewBg === 'dark' ? 'bg-zinc-800 text-white font-medium shadow' : 'text-zinc-500 hover:text-zinc-400'
            }`}
          >
            纯深色
          </button>
          <button
            onClick={() => setPreviewBg('light')}
            className={`py-1.5 px-1 rounded-md text-center transition-all cursor-pointer ${
              previewBg === 'light' ? 'bg-zinc-800 text-white font-medium shadow' : 'text-zinc-500 hover:text-zinc-400'
            }`}
          >
            纯浅色
          </button>
          <button
            onClick={() => setPreviewBg('custom')}
            className={`py-1.5 px-1 rounded-md text-center transition-all cursor-pointer ${
              previewBg === 'custom' ? 'bg-zinc-800 text-white font-medium shadow' : 'text-zinc-500 hover:text-zinc-400'
            }`}
          >
            自定义
          </button>
        </div>

        {previewBg === 'custom' && (
          <div className="flex gap-2 items-center animate-fadeIn pt-1">
            <input 
              type="color" 
              value={customBgColor} 
              onChange={(e) => setCustomBgColor(e.target.value)}
              className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer overflow-hidden p-0"
            />
            <input 
              type="text" 
              value={customBgColor} 
              onChange={(e) => setCustomBgColor(e.target.value)}
              title="调色板背景"
              placeholder="#HEX"
              className="w-full h-8 px-2 rounded bg-zinc-950/40 border border-zinc-800 text-xs text-white uppercase font-mono outline-none focus:border-zinc-700"
            />
          </div>
        )}
      </div>

      {/* 5. One click download! */}
      <div className="p-5 mt-auto bg-zinc-950/40 border-t border-zinc-800/50">
        <button
          onClick={onDownload}
          disabled={!imageLoaded}
          id="download_btn"
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 px-6 font-semibold text-white shadow-xl transition-all duration-300 ${
            imageLoaded 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 shadow-emerald-900/10 hover:shadow-emerald-900/20 active:scale-98 cursor-pointer' 
              : 'bg-zinc-800 text-zinc-500 border border-zinc-800 cursor-not-allowed'
          }`}
        >
          <Download className="h-5 w-5" />
          一键下载透明背景 PNG
        </button>
        <p className="mt-2.5 text-center text-[10px] text-zinc-500">
          基于 HTML5 高精图像合成，透明边沿绝无毛边暗沉。
        </p>
      </div>

    </aside>
  );
}
