import React from 'react';
import { formatMW, formatPercent } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export function DailyAccuracyTable({ days = [] }) {
  if (!days.length) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-6 text-center text-slate-500">
        No daily historical accuracy records available
      </div>
    );
  }

  const getGradeStyle = (grade) => {
    switch (grade) {
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

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md overflow-hidden">
      <div className="p-4 border-b border-slate-800/80">
        <h3 className="text-sm font-bold text-white">Daily Forecast Reliability Benchmark</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Multi-day historical evaluation of procurement error performance
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-4">Delivery Date</th>
              <th className="py-2.5 px-4 text-right">MAE</th>
              <th className="py-2.5 px-4 text-right">RMSE</th>
              <th className="py-2.5 px-4 text-right">MAPE</th>
              <th className="py-2.5 px-4 text-right">Mean Bias</th>
              <th className="py-2.5 px-4 text-right">Peak Actual</th>
              <th className="py-2.5 px-4 text-right">Reliability Index</th>
              <th className="py-2.5 px-4 text-center">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {days.map((row) => (
              <tr key={row.date} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-4 font-bold text-white">{row.date}</td>
                <td className="py-2.5 px-4 text-right font-medium text-cyan-400">
                  {formatMW(row.maeMW)}
                </td>
                <td className="py-2.5 px-4 text-right text-slate-300">
                  {formatMW(row.rmseMW)}
                </td>
                <td className="py-2.5 px-4 text-right text-slate-300">
                  {formatPercent(row.mapePercent)}
                </td>
                <td className="py-2.5 px-4 text-right">
                  <span
                    className={
                      row.meanBiasMW > 0
                        ? 'text-amber-400'
                        : row.meanBiasMW < 0
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }
                  >
                    {row.meanBiasMW > 0 ? `+${formatMW(row.meanBiasMW)}` : formatMW(row.meanBiasMW)}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right text-emerald-400">
                  {formatMW(row.peakActualMW)}
                </td>
                <td className="py-2.5 px-4 text-right font-bold text-white">
                  {row.reliabilityScore}/100
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider',
                      getGradeStyle(row.accuracyGrade)
                    )}
                  >
                    {row.accuracyGrade}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
