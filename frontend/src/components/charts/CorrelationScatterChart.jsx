import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Crosshair } from 'lucide-react';
import { formatMW, formatTimeOnly } from '../../utils/formatters';

export function CorrelationScatterChart({ data = [], height = 300 }) {
  const points = data
    .filter((d) => d.actualMW !== null && d.actualMW !== undefined)
    .map((d) => ({
      x: d.forecastMW,
      y: d.actualMW,
      errorMW: d.errorMW,
      sp: d.settlementPeriod,
      timestamp: d.timestamp,
    }));

  if (!points.length) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md flex items-center justify-center h-[300px] text-slate-500">
        No actual vs forecast data pairs available for scatter plot
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const pt = payload[0].payload;

    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md text-xs font-mono">
        <div className="font-bold text-white border-b border-slate-800 pb-1 mb-1">
          SP {pt.sp} • {formatTimeOnly(pt.timestamp)} UTC
        </div>
        <div className="space-y-1 text-slate-300">
          <div className="flex justify-between gap-4">
            <span className="text-cyan-400">Forecast:</span>
            <span>{formatMW(pt.x)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-emerald-400">Actual Outturn:</span>
            <span>{formatMW(pt.y)}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-slate-800 pt-1">
            <span className="text-slate-400">Error Delta:</span>
            <span className={pt.errorMW > 0 ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
              {pt.errorMW > 0 ? `+${formatMW(pt.errorMW)}` : formatMW(pt.errorMW)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const maxVal = Math.max(...points.map((p) => Math.max(p.x, p.y))) * 1.05;

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-cyan-400" />
            Forecast vs Actual Correlation (Parity Plot)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            45° diagonal represents 1:1 perfect forecast prediction accuracy
          </p>
        </div>
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" /> Settlement Point
          <span className="inline-block h-0.5 w-4 bg-slate-500 ml-2" /> 1:1 Parity Line
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              type="number"
              dataKey="x"
              name="Forecast"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              unit=" MW"
              domain={[0, maxVal]}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Actual"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              unit=" MW"
              domain={[0, maxVal]}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              segment={[
                { x: 0, y: 0 },
                { x: maxVal, y: maxVal },
              ]}
              stroke="#64748b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Scatter name="Delivery Points" data={points} fill="#38bdf8" fillOpacity={0.65} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
