import React from 'react';
import { Layers, Image as ImageIcon, Github } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 text-white shadow-lg shadow-rose-500/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-sans text-lg font-semibold tracking-tight text-white flex items-center gap-2">
              白底抠图 <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400">Pro</span>
            </h1>
            <p className="text-xs text-zinc-400">
              精确去除图片白色背景 · 支持边缘羽化与手动画笔精修 · 一键导出透明PNG
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 font-mono">
          <span>v1.2.0</span>
          <span className="text-zinc-700">•</span>
          <span>纯本地密闭处理 · 更安全高效</span>
        </div>
      </div>
    </header>
  );
}
