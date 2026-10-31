import React from 'react';
import { cn } from '../../utils/cn';

export function MetricCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  trend,
  trendDirection, // 'up' | 'down' | 'neutral'
  variant = 'cyan', // 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate'
  tooltip,
}) {
  const variantStyles = {
    cyan: {
      border: 'hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.15)]',
      accent: 'text-cyan-400',
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.15)]',
      accent: 'text-emerald-400',
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.15)]',
      accent: 'text-amber-400',
    },
    rose: {
      border: 'hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(244,63,94,0.15)]',
      accent: 'text-rose-400',
    },
    slate: {
      border: 'hover:border-slate-500/40',
      iconBg: 'bg-slate-800 text-slate-300 border border-slate-700',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(148,163,184,0.1)]',
      accent: 'text-slate-300',
    },
  }[variant] || {};

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-300',
        variantStyles.border,
        variantStyles.glow
      )}
      title={tooltip}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">{value}</span>
            {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
          </div>
        </div>
        {Icon && (
          <div className={cn('rounded-lg p-2.5 transition-colors', variantStyles.iconBg)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center font-medium font-mono',
                trendDirection === 'up'
                  ? 'text-emerald-400'
                  : trendDirection === 'down'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              )}
            >
              {trend}
            </span>
          )}
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
        </div>
      )}

      {/* Decorative gradient flare on card top */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-24 w-24 rounded-full bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/10 transition-colors" />
    </div>
  );
}
