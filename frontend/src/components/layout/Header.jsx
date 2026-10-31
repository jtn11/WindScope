import React, { useState, useEffect } from 'react';
import { Wind, RefreshCw, Clock, Globe, Shield, Activity } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Header({
  days = 2,
  setDays,
  onRefresh,
  loading = false,
  lastUpdated,
  source = 'Elexon BMRS',
}) {
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(
        new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'UTC',
          hour12: false,
        }).format(now) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Wind className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-sans">
                WindScope
              </h1>
              <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Wind Generation Intelligence Platform • GB Balancing Market
            </p>
          </div>
        </div>

        {/* Center: Market Status Indicator & Clock */}
        <div className="hidden md:flex items-center gap-4 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">BMRS FEED: LIVE</span>
          </div>

          <div className="h-3 w-px bg-slate-700" />

          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-200">{utcTime || '00:00:00 UTC'}</span>
          </div>
        </div>

        {/* Right: Horizon Range & Refresh Action */}
        <div className="flex items-center gap-2.5">
          {/* Horizon Preset Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            {[
              { label: 'Today (1D)', val: 1 },
              { label: 'Day-Ahead (2D)', val: 2 },
              { label: '3 Days', val: 3 },
              { label: '7 Days', val: 7 },
            ].map((option) => (
              <button
                key={option.val}
                onClick={() => setDays(option.val)}
                className={cn(
                  'px-2.5 py-1 rounded font-medium transition-all',
                  days === option.val
                    ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            title="Refresh Elexon Data"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-cyan-400', loading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
