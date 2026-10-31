import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Clock, Info } from 'lucide-react';
import { formatMW } from '../../utils/formatters';

export function SettlementPeriodErrorChart({ periods = [], height = 300 }) {
  if (!periods || periods.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md flex items-center justify-center h-[300px] text-slate-500">
        No settlement period diurnal data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;

    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md text-xs font-mono">
        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-1.5">
          <span className="font-bold text-white">SP {item.settlementPeriod} ({item.timeLabel} UTC)</span>
          <span className="text-[10px] text-slate-400">{item.sampleCount} days avg</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4 text-cyan-400">
            <span>Avg Forecast:</span>
            <span className="font-semibold text-white">{formatMW(item.avgForecastMW)}</span>
          </div>
          <div className="flex justify-between gap-4 text-emerald-400">
            <span>Avg Actual:</span>
            <span className="font-semibold text-white">{formatMW(item.avgActualMW)}</span>
          </div>
          <div className="flex justify-between gap-4 text-amber-400 pt-1 border-t border-slate-800">
            <span>Avg Absolute Error:</span>
            <span className="font-semibold text-white">{formatMW(item.avgAbsErrorMW)}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-400">
            <span>Mean Bias:</span>
            <span className={item.avgErrorMW > 0 ? 'text-amber-400' : 'text-rose-400'}>
              {item.avgErrorMW > 0 ? `+${formatMW(item.avgErrorMW)}` : formatMW(item.avgErrorMW)}
            </span>
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
            <Clock className="h-4 w-4 text-cyan-400" />
            Diurnal Settlement Period Error Profile (SP 1 - 48)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Average day-ahead forecast error across 24-hour delivery cycle (Half-hour intervals)
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-amber-500/80 inline-block" /> Avg Absolute Error (MW)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-cyan-400 inline-block" /> Avg Forecast
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-emerald-400 inline-block" /> Avg Actual
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={periods} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="settlementPeriod"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              interval={3}
              tickFormatter={(sp) => `SP${sp}`}
            />
            <YAxis
              yAxisId="left"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#f59e0b"
              fontSize={10}
              tickLine={false}
              tickFormatter={(v) => `${v}MW`}
            />
            <Tooltip content={<CustomTooltip />} />

            <Bar
              yAxisId="right"
              dataKey="avgAbsErrorMW"
              fill="#f59e0b"
              fillOpacity={0.4}
              name="Avg Absolute Error (MW)"
              radius={[2, 2, 0, 0]}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgForecastMW"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              name="Avg Forecast"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgActualMW"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Avg Actual"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
