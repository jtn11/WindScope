import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import { BarChart3, Info } from 'lucide-react';
import { formatMW } from '../../utils/formatters';

export function ErrorDistributionChart({ distribution, height = 300 }) {
  if (!distribution || !distribution.bins || distribution.bins.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md flex items-center justify-center h-[300px] text-slate-500">
        No error distribution data available
      </div>
    );
  }

  const { bins, p10ErrorMW, p50ErrorMW, p90ErrorMW, skewness, totalSamples } = distribution;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const bin = payload[0].payload;

    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md text-xs font-mono">
        <p className="font-bold text-white mb-1">{bin.binRange}</p>
        <div className="space-y-1 text-slate-300">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Frequency:</span>
            <span className="font-semibold text-white">{bin.count} intervals</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Share of Delivery:</span>
            <span className="font-semibold text-cyan-400">{bin.percentage}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            Forecast Error Distribution (MW Residuals)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical spread of (Forecast - Actual) across {totalSamples} settlement intervals
          </p>
        </div>

        {/* Quantiles indicator pills */}
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="bg-slate-800 px-2 py-0.5 rounded text-rose-400 border border-slate-700" title="10th Percentile">
            P10: {formatMW(p10ErrorMW)}
          </span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-cyan-400 border border-slate-700" title="50th Percentile (Median Bias)">
            P50: {formatMW(p50ErrorMW)}
          </span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-400 border border-slate-700" title="90th Percentile">
            P90: {formatMW(p90ErrorMW)}
          </span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700" title="Pearson Skewness">
            Skew: {skewness}
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="binRange"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              angle={-20}
              textAnchor="end"
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
              {bins.map((entry, index) => {
                // Color code: center is green/cyan, under-forecast is rose, over-forecast is amber
                let color = '#38bdf8';
                if (entry.maxMW <= 0) {
                  color = index <= 1 ? '#f43f5e' : '#fb7185';
                } else if (entry.minMW >= 500) {
                  color = entry.minMW >= 1000 ? '#f59e0b' : '#fbbf24';
                } else {
                  color = '#10b981';
                }
                return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.85} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2">
        <span>← Under-forecast (Short in Market)</span>
        <span>Ideal Accuracy (Zero Bias)</span>
        <span>Over-forecast (Long in Market) →</span>
      </div>
    </div>
  );
}
