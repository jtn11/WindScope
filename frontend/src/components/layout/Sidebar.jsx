import React from 'react';
import {
  LayoutDashboard,
  LineChart,
  Target,
  BookOpen,
  Zap,
  Radio,
  Server,
  Layers,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export function Sidebar({ currentTab = 'dashboard', setTab }) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      description: 'Procurement overview & live KPIs',
      icon: LayoutDashboard,
    },
    {
      id: 'forecast',
      label: 'Forecast Horizon',
      description: 'Day-Ahead & Intraday generation',
      icon: LineChart,
    },
    {
      id: 'accuracy',
      label: 'Accuracy & Reliability',
      description: 'MAE, RMSE & error quantiles',
      icon: Target,
    },
    {
      id: 'methodology',
      label: 'Market & Methodology',
      description: 'BSC balancing & formula guides',
      icon: BookOpen,
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800/80 bg-slate-950/60 p-4 flex flex-col justify-between hidden lg:flex">
      {/* Navigation Links */}
      <div className="space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
            Navigation Menu
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-start gap-3 group',
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_20px_-3px_rgba(6,182,212,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 mt-0.5 transition-colors',
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                    )}
                  />
                  <div>
                    <div className={cn('font-semibold', isActive ? 'text-white' : 'text-slate-300')}>
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Market Overview */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-2">
            <Radio className="h-3.5 w-3.5 text-cyan-400" />
            <span>GB Wind Fleet</span>
          </div>
          <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Installed Cap:</span>
              <span className="text-white font-semibold">29,500 MW</span>
            </div>
            <div className="flex justify-between">
              <span>Settlement:</span>
              <span className="text-white">Half-Hourly (48 SP)</span>
            </div>
            <div className="flex justify-between">
              <span>Market Gate:</span>
              <span className="text-cyan-400">12:00 D-1 (DAP)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-3 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <Server className="h-3 w-3 text-emerald-400" />
          <span>Elexon BMRS v1</span>
        </div>
        <p className="text-[10px] text-slate-400">
          WINDFOR Day-Ahead Forecasts & B1620 Actuals API
        </p>
      </div>
    </aside>
  );
}
