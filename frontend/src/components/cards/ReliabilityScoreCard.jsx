import React from 'react';
import { ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../utils/cn';

export function ReliabilityScoreCard({ score = 89.2, grade = 'A', nmae = 3.4, mape = 6.8 }) {
  const getGradeColor = (g) => {
    switch (g) {
      case 'A':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'B':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'C':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
  };

  const getReliabilityStatus = (s) => {
    if (s >= 88) return { label: 'High Procurement Reliability', desc: 'Minimal imbalance risk for day-ahead hedging.' };
    if (s >= 75) return { label: 'Moderate Reliability', desc: 'Consider 10-15% reserve buffer for peak periods.' };
    if (s >= 60) return { label: 'Elevated Uncertainty', desc: 'Frequent forecast deviations. Recommend intraday adjustments.' };
    return { label: 'High Risk / Severe Mismatch', desc: 'Substantial imbalance exposure. Active hedging required.' };
  };

  const status = getReliabilityStatus(score);

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Procurement Reliability Index
          </h3>
        </div>
        <span
          className={cn(
            'px-2.5 py-0.5 rounded text-xs font-bold font-mono border tracking-wider',
            getGradeColor(grade)
          )}
        >
          GRADE {grade}
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-4xl font-extrabold font-mono tracking-tight text-white">{score}</span>
        <span className="text-sm font-semibold text-slate-400">/ 100</span>
      </div>

      {/* Visual Progress Bar */}
      <div className="mt-3 w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            score >= 80 ? 'bg-gradient-to-r from-cyan-500 to-emerald-400' : score >= 60 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-rose-500 to-red-400'
          )}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>

      <div className="mt-4 border-t border-slate-800/80 pt-3">
        <p className="text-xs font-medium text-slate-200">{status.label}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{status.desc}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50">
        <div>
          <span className="text-slate-500 block">Norm. MAE:</span>
          <span className="text-slate-200 font-semibold">{nmae}%</span>
        </div>
        <div>
          <span className="text-slate-500 block">Median MAPE:</span>
          <span className="text-slate-200 font-semibold">{mape}%</span>
        </div>
      </div>
    </div>
  );
}
