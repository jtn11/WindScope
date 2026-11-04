import React, { useState, useEffect } from 'react';
import { Wind, RefreshCw, Clock, Calendar, Filter } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Header({
  startDate = '2026-01-01',
  endDate = '2026-01-01',
  setDateRange,
  cutoff = '12:00',
  setCutoff,
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

  const janPresets = [
    { label: 'Jan 1', start: '2026-01-01', end: '2026-01-01' },
    { label: 'Jan 1–7', start: '2026-01-01', end: '2026-01-07' },
    { label: 'Jan 8–14', start: '2026-01-08', end: '2026-01-14' },
    { label: 'Jan 15–21', start: '2026-01-15', end: '2026-01-21' },
    { label: 'Jan 22–31', start: '2026-01-22', end: '2026-01-31' },
    { label: 'Full Jan', start: '2026-01-01', end: '2026-01-31' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Wind className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-sans">
                WindScope
              </h1>
              <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                Elexon BMRS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              January 2026 Wind Generation Intelligence • FUELHH & WINDFOR
            </p>
          </div>
        </div>

        {/* Center: Live BMRS Feed & UTC Clock */}
        <div className="hidden xl:flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-lg text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">BMRS FUELHH & WINDFOR: CONNECTED</span>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="h-3 w-3 text-cyan-400" />
            <span className="text-slate-200">{utcTime || '00:00:00 UTC'}</span>
          </div>
        </div>

        {/* Right: January Date Filters, Decision Cutoff, and Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Purchasing Decision Cutoff Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-400 text-[11px] font-mono hidden sm:inline">Cutoff:</span>
            <select
              value={cutoff}
              onChange={(e) => setCutoff(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer"
              title="Purchasing Decision Cutoff (Selects forecast published before gate closure)"
            >
              <option value="12:00" className="bg-slate-900 text-slate-200">
                Day-Ahead 12:00 D-1 (11:30 Publish)
              </option>
              <option value="09:30" className="bg-slate-900 text-slate-200">
                Morning 09:30 D-1 Publish
              </option>
              <option value="07:30" className="bg-slate-900 text-slate-200">
                Early 07:30 D-1 Publish
              </option>
              <option value="04:30" className="bg-slate-900 text-slate-200">
                Dawn 04:30 D-1 Publish
              </option>
              <option value="02:30" className="bg-slate-900 text-slate-200">
                Overnight 02:30 D-1 Publish
              </option>
              <option value="15:30" className="bg-slate-900 text-slate-200">
                Intraday 15:30 D-1 Publish
              </option>
              <option value="18:30" className="bg-slate-900 text-slate-200">
                Evening 18:30 D-1 Publish
              </option>
              <option value="22:30" className="bg-slate-900 text-slate-200">
                Night-Before 22:30 D-1 Publish
              </option>
            </select>
          </div>

          {/* January 2026 Date Presets */}
          <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            {janPresets.map((preset) => {
              const isSelected = startDate === preset.start && endDate === preset.end;
              return (
                <button
                  key={preset.label}
                  onClick={() => setDateRange(preset.start, preset.end)}
                  className={cn(
                    'px-2 py-1 rounded font-medium transition-all text-[11px]',
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Picker (January 2026) */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono">
            <Calendar className="h-3 w-3 text-cyan-400" />
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={startDate}
              onChange={(e) => setDateRange(e.target.value, e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            />
          </div>

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            title="Refresh Real Elexon Data"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-cyan-400', loading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
