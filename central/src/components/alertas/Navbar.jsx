import React from 'react';
import { Bell, Globe } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1e2a3a] bg-[#0b1120]/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">M</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-wide hidden sm:block">MANTEIVIAS</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors">
            <Globe className="w-4 h-4" />
            PT
          </button>
          <button className="relative p-1.5 text-slate-300 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-blue-500" />
          </button>
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-white font-medium leading-none">Utilizador</p>
              <p className="text-xs text-slate-400 mt-0.5">222222222</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              U
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}