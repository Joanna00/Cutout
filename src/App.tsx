/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ImageWorkspace from './components/ImageWorkspace';
import ControlPanel from './components/ControlPanel';
import { generateSampleImage } from './utils/sampleImage';
import { BrushMode, ThemeMode, HistoryState } from './types';

// Fast Hex to RGB conversion helper
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
}

// Deep clone of offscreen canvases for perfect lightweight undo/redo history tracking
const cloneCanvas = (oldCanvas: HTMLCanvasElement): HTMLCanvasElement => {
  const newCanvas = document.createElement('canvas');
  newCanvas.width = oldCanvas.width;
  newCanvas.height = oldCanvas.height;
  const ctx = newCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(oldCanvas, 0, 0);
  }
  return newCanvas;
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Hidden offscreen canvases to hold source pixels and manual overlay masks
  const originalCanvas = useRef<HTMLCanvasElement | null>(null);
  const restoreCanvas = useRef<HTMLCanvasElement | null>(null);
  const eraseCanvas = useRef<HTMLCanvasElement | null>(null);

  // Core background-keying parameters
  const [targetColor, setTargetColor] = useState<string>('#ffffff');
  const [tolerance, setTolerance] = useState<number>(35);
  const [feathering, setFeathering] = useState<number>(10);

  // Brush settings
  const [brushMode, setBrushMode] = useState<BrushMode>('none');
  const [brushSize, setBrushSize] = useState<number>(20);

  // Viewport transformation (zoom and pan) status
  const [zoom, setZoom] = useState<number>(100);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);

  // Background and asset details
  const [previewBg, setPreviewBg] = useState<ThemeMode>('checkerboard');
  const [customBgColor, setCustomBgColor] = useState<string>('#4f46e5');
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('sample_image.png');
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Undo/Redo stack details
  const [history, setHistory] = useState<{ restore: HTMLCanvasElement; erase: HTMLCanvasElement }[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Live pixel computation and alpha keying loop
  const processImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !originalCanvas.current || !restoreCanvas.current || !eraseCanvas.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    const origCtx = originalCanvas.current.getContext('2d', { willReadFrequently: true });
    const restCtx = restoreCanvas.current.getContext('2d', { willReadFrequently: true });
    const erCtx = eraseCanvas.current.getContext('2d', { willReadFrequently: true });

    if (!origCtx || !restCtx || !erCtx) return;

    const origData = origCtx.getImageData(0, 0, w, h);
    const restData = restCtx.getImageData(0, 0, w, h);
    const erData = erCtx.getImageData(0, 0, w, h);

    const outputImgData = ctx.createImageData(w, h);

    const rgb = hexToRgb(targetColor);
    const targetR = rgb.r;
    const targetG = rgb.g;
    const targetB = rgb.b;

    // Prefactor square thresholds to maximize pixel looping speed
    const toleranceSq = tolerance * tolerance;
    const outerThreshold = tolerance + feathering;
    const outerThresholdSq = outerThreshold * outerThreshold;

    const origDataArr = origData.data;
    const restDataArr = restData.data;
    const erDataArr = erData.data;
    const outDataArr = outputImgData.data;

    const totalPixels = w * h;
    for (let i = 0; i < totalPixels; i++) {
      const i4 = i * 4;

      // 1. Force transparent if erase brush is applied
      if (erDataArr[i4 + 3] > 10) { 
        outDataArr[i4] = 0;
        outDataArr[i4 + 1] = 0;
        outDataArr[i4 + 2] = 0;
        outDataArr[i4 + 3] = 0;
        continue;
      }

      // 2. Load original color directly if restore brush is applied
      if (restDataArr[i4 + 3] > 10) { 
        outDataArr[i4] = origDataArr[i4];
        outDataArr[i4 + 1] = origDataArr[i4 + 1];
        outDataArr[i4 + 2] = origDataArr[i4 + 2];
        outDataArr[i4 + 3] = origDataArr[i4 + 3];
        continue;
      }

      // 3. Process normal chroma-keying with linear feather borders
      const r = origDataArr[i4];
      const g = origDataArr[i4 + 1];
      const b = origDataArr[i4 + 2];
      const orgAlpha = origDataArr[i4 + 3];

      if (orgAlpha === 0) {
        outDataArr[i4] = 0;
        outDataArr[i4 + 1] = 0;
        outDataArr[i4 + 2] = 0;
        outDataArr[i4 + 3] = 0;
        continue;
      }

      const dr = r - targetR;
      const dg = g - targetG;
      const db = b - targetB;
      const sqDist = dr * dr + dg * dg + db * db;

      if (sqDist <= toleranceSq) {
        outDataArr[i4] = r;
        outDataArr[i4 + 1] = g;
        outDataArr[i4 + 2] = b;
        outDataArr[i4 + 3] = 0; // Transparent cutout
      } else if (sqDist >= outerThresholdSq) {
        // Safe zone - keeps raw colors untouched
        outDataArr[i4] = r;
        outDataArr[i4 + 1] = g;
        outDataArr[i4 + 2] = b;
        outDataArr[i4 + 3] = orgAlpha;
      } else {
        // Gradient semi-transparent feathered transition line
        const d = Math.sqrt(sqDist);
        const divisor = feathering === 0 ? 1 : feathering;
        const ratio = (d - tolerance) / divisor;
        const calculatedAlpha = Math.min(orgAlpha, Math.floor(ratio * orgAlpha));
        
        outDataArr[i4] = r;
        outDataArr[i4 + 1] = g;
        outDataArr[i4 + 2] = b;
        outDataArr[i4 + 3] = calculatedAlpha;
      }
    }

    ctx.putImageData(outputImgData, 0, 0);
  };

  // Re-run color removal algorithm in response to user parameter adjustments
  useEffect(() => {
    if (imageLoaded) {
      processImage();
    }
  }, [tolerance, feathering, targetColor, imageLoaded]);

  // Handle programmatically loading the sample illustration on initial launch
  const loadSampleImage = () => {
    setIsProcessing(true);
    const w = 600;
    const h = 600;
    setOriginalWidth(w);
    setOriginalHeight(h);
    setFileName('sample_face_sunglasses.png');

    // Create programmatical original canvas
    const origCanvas = document.createElement('canvas');
    origCanvas.width = w;
    origCanvas.height = h;
    generateSampleImage(origCanvas);
    originalCanvas.current = origCanvas;

    // Create blank restore mask
    const restCanvas = document.createElement('canvas');
    restCanvas.width = w;
    restCanvas.height = h;
    restoreCanvas.current = restCanvas;

    // Create blank erase mask
    const erCanvas = document.createElement('canvas');
    erCanvas.width = w;
    erCanvas.height = h;
    eraseCanvas.current = erCanvas;

    // Map output dimensions
    const outCanvas = canvasRef.current;
    if (outCanvas) {
      outCanvas.width = w;
      outCanvas.height = h;
    }

    // Centered Viewport reset
    setZoom(100);
    setPanX(0);
    setPanY(0);

    // Initial item inside history stack
    const initialItem = {
      restore: cloneCanvas(restCanvas),
      erase: cloneCanvas(erCanvas)
    };
    setHistory([initialItem]);
    setHistoryIndex(0);

    setImageLoaded(true);
    setIsProcessing(false);

    // Initial background rendering frame trigger
    setTimeout(() => {
      processImage();
    }, 50);
  };

  useEffect(() => {
    loadSampleImage();
  }, []);

  // Handle file uploads (converts input image and maps scaling to prevent CPU lag)
  const handleFileUpload = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        
        // Scaledown high-res items if higher than 1600px to maintain crisp real-time rendering
        const MAX_SIZE = 1600;
        if (w > MAX_SIZE || h > MAX_SIZE) {
          if (w > h) {
            h = Math.round((h * MAX_SIZE) / w);
            w = MAX_SIZE;
          } else {
            w = Math.round((w * MAX_SIZE) / h);
            h = MAX_SIZE;
          }
        }

        setOriginalWidth(w);
        setOriginalHeight(h);

        // Bind hidden canvas
        const origCanvas = document.createElement('canvas');
        origCanvas.width = w;
        origCanvas.height = h;
        const origCtx = origCanvas.getContext('2d');
        if (origCtx) {
          origCtx.drawImage(img, 0, 0, w, h);
        }
        originalCanvas.current = origCanvas;

        const restCanvas = document.createElement('canvas');
        restCanvas.width = w;
        restCanvas.height = h;
        restoreCanvas.current = restCanvas;

        const erCanvas = document.createElement('canvas');
        erCanvas.width = w;
        erCanvas.height = h;
        eraseCanvas.current = erCanvas;

        const outCanvas = canvasRef.current;
        if (outCanvas) {
          outCanvas.width = w;
          outCanvas.height = h;
        }

        // Viewport Reset
        setZoom(100);
        setPanX(0);
        setPanY(0);

        // Reset History
        const initialItem = {
          restore: cloneCanvas(restCanvas),
          erase: cloneCanvas(erCanvas)
        };
        setHistory([initialItem]);
        setHistoryIndex(0);

        setImageLoaded(true);
        setIsProcessing(false);

        setTimeout(() => {
          processImage();
        }, 50);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Triggered during manual uploads inside Sidebar input
  const handleUploadInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  // Drawing Brush Action handlers (Restoring / Erasing)
  const [strokeDrawnThisSession, setStrokeDrawnThisSession] = useState(false);

  const handleDrawStart = () => {
    setStrokeDrawnThisSession(true);
  };

  const handleDrawStroke = (prevX: number, prevY: number, currX: number, currY: number) => {
    let maskCanvas: HTMLCanvasElement | null = null;
    if (brushMode === 'restore') {
      maskCanvas = restoreCanvas.current;
    } else if (brushMode === 'erase') {
      maskCanvas = eraseCanvas.current;
    }

    if (!maskCanvas) return;

    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);

    ctx.strokeStyle = 'rgba(0, 0, 0, 1.0)'; // solid mask paint
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.stroke();
    ctx.restore();

    // Call direct rendering of blended values live
    processImage();
  };

  const handleDrawEnd = () => {
    if (!strokeDrawnThisSession) return;
    setStrokeDrawnThisSession(false);

    // Save current mask canvases into our Undo Stack
    const nextIndex = historyIndex + 1;
    const newHistory = history.slice(0, nextIndex);

    newHistory.push({
      restore: cloneCanvas(restoreCanvas.current!),
      erase: cloneCanvas(eraseCanvas.current!)
    });

    // Constrain history to maximum 15 items to maintain quick reactivity
    if (newHistory.length > 15) {
      newHistory.shift();
      setHistoryIndex(14);
    } else {
      setHistoryIndex(nextIndex);
    }

    setHistory(newHistory);
  };

  // History operations (Undo & Redo)
  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const prevIndex = historyIndex - 1;
    const prevState = history[prevIndex];

    restoreCanvas.current = cloneCanvas(prevState.restore);
    eraseCanvas.current = cloneCanvas(prevState.erase);

    setHistoryIndex(prevIndex);

    setTimeout(() => {
      processImage();
    }, 10);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const nextState = history[nextIndex];

    restoreCanvas.current = cloneCanvas(nextState.restore);
    eraseCanvas.current = cloneCanvas(nextState.erase);

    setHistoryIndex(nextIndex);

    setTimeout(() => {
      processImage();
    }, 10);
  };

  // Reset/Clear all brush lines
  const handleClearBrush = () => {
    if (!restoreCanvas.current || !eraseCanvas.current) return;
    
    const restCtx = restoreCanvas.current.getContext('2d');
    const erCtx = eraseCanvas.current.getContext('2d');
    
    if (restCtx && erCtx) {
      restCtx.clearRect(0, 0, originalWidth, originalHeight);
      erCtx.clearRect(0, 0, originalWidth, originalHeight);
    }

    // Force commit to empty state history
    handleDrawStart();
    setTimeout(() => {
      handleDrawEnd();
      processImage();
    }, 20);
  };

  // Download Transparent Image
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    // Grab file base without extension
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    const downloadName = `${baseName}_transparent.png`;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = downloadName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Download failed to initialize", e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white selection:bg-rose-500/30 selection:text-white">
      {/* 1. Page Header */}
      <Header />

      {/* 2. Main Workspace Layout Grid */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0">
        
        {/* Left/Middle Content Area: Image Viewer Workspace */}
        <div className="flex-1 flex flex-col relative bg-zinc-950 min-h-0">
          
          {isProcessing ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-zinc-950/80 backdrop-blur-sm z-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-500 border-t-transparent shadow-lg shadow-rose-500/15" />
              <p className="text-sm font-medium text-zinc-300">正在处理图像渲染中...</p>
            </div>
          ) : null}

          <ImageWorkspace
            canvasRef={canvasRef}
            brushMode={brushMode}
            brushSize={brushSize}
            zoom={zoom}
            setZoom={setZoom}
            panX={panX}
            setPanX={setPanX}
            panY={panY}
            setPanY={setPanY}
            previewBg={previewBg}
            customBgColor={customBgColor}
            imageLoaded={imageLoaded}
            onDrawStart={handleDrawStart}
            onDrawStroke={handleDrawStroke}
            onDrawEnd={handleDrawEnd}
            onSampleColor={setTargetColor}
            onUploadFiles={handleFileUpload}
          />
        </div>

        {/* Right Sidepanel: Controls Tuning */}
        <ControlPanel
          tolerance={tolerance}
          setTolerance={setTolerance}
          feathering={feathering}
          setFeathering={setFeathering}
          targetColor={targetColor}
          setTargetColor={setTargetColor}
          brushMode={brushMode}
          setBrushMode={setBrushMode}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          previewBg={previewBg}
          setPreviewBg={setPreviewBg}
          customBgColor={customBgColor}
          setCustomBgColor={setCustomBgColor}
          onDownload={handleDownloadImage}
          onUpload={handleUploadInputChange}
          imageLoaded={imageLoaded}
          fileName={fileName}
          originalWidth={originalWidth}
          originalHeight={originalHeight}
          undo={handleUndo}
          redo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onClearBrush={handleClearBrush}
          onResetSample={loadSampleImage}
        />

      </main>

    </div>
  );
}
