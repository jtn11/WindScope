import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { formatMW, formatPercent, formatTimeOnly } from '../../utils/formatters';
import { Zap } from 'lucide-react';
import { cn } from '../../utils/cn';

export function GenerationForecastChart({ data = [], height = 400 }) {
  const [showForecast, setShowForecast] = useState(true);
  const [showActual, setShowActual] = useState(true);
  const [showErrorBars, setShowErrorBars] = useState(true);

  // Format chart data for smooth rendering
  const formattedData = useMemo(() => {
    return data.map((item) => {
      const dt = new Date(item.timestamp);
      const timeStr = `${dt.getUTCDate()} Jan ${formatTimeOnly(item.timestamp)}`;
      
      return {
        ...item,
        timeLabel: timeStr,
      };
    });
  }, [data]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const pt = payload[0].payload;

    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-xs font-mono min-w-[240px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-300">
          <span className="font-semibold text-white">{pt.timeLabel} UTC</span>
          <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-cyan-400 font-bold">
            SP {pt.settlementPeriod}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400 inline-block" />
              WINDFOR Forecast:
            </span>
            <span className="font-bold text-white">{formatMW(pt.forecastMW)}</span>
          </div>

          {pt.actualMW !== null && pt.actualMW !== undefined ? (
            <>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
                  FUELHH Actual:
                </span>
                <span className="font-bold text-white">{formatMW(pt.actualMW)}</span>
              </div>

              <div className="border-t border-slate-800 pt-1.5 mt-1.5 flex justify-between items-center">
                <span className="text-slate-400">Prediction Error:</span>
                <span
                  className={cn(
                    'font-bold',
                    pt.errorMW > 0 ? 'text-amber-400' : pt.errorMW < 0 ? 'text-rose-400' : 'text-slate-300'
                  )}
                >
                  {pt.errorMW > 0 ? `+${formatMW(pt.errorMW)}` : formatMW(pt.errorMW)}
                </span>
              </div>

              {pt.percentageError !== null && pt.percentageError !== undefined && (
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Error %:</span>
                  <span className="text-slate-200">{formatPercent(pt.percentageError)}</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-[11px] text-cyan-400/80 italic pt-1 border-t border-slate-800">
              • Actual outturn pending / not available
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md">
      {/* Chart Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            Forecast vs Actual Wind Generation (January 2026)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Matched half-hourly settlement intervals using startTime • GB National Grid (MW)
          </p>
        </div>

        {/* Series Visibility Toggles */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowForecast(!showForecast)}
            className={cn(
              'px-2.5 py-1 rounded-md border font-medium flex items-center gap-1.5 transition-colors',
              showForecast
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            )}
          >
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            Forecast (WINDFOR)
          </button>

          <button
            onClick={() => setShowActual(!showActual)}
            className={cn(
              'px-2.5 py-1 rounded-md border font-medium flex items-center gap-1.5 transition-colors',
              showActual
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            )}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Actual (FUELHH)
          </button>

          <button
            onClick={() => setShowErrorBars(!showErrorBars)}
            className={cn(
              'px-2.5 py-1 rounded-md border font-medium flex items-center gap-1.5 transition-colors',
              showErrorBars
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            )}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Error Delta
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={45}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />

            <Tooltip content={<CustomTooltip />} />

            <ReferenceLine y={0} stroke="#334155" />

            {/* Error delta bars */}
            {showErrorBars && (
              <Bar
                dataKey="errorMW"
                fill="#f59e0b"
                opacity={0.65}
                name="Prediction Error (MW)"
                radius={[2, 2, 0, 0]}
              />
            )}

            {/* Day-Ahead Forecast Area */}
            {showForecast && (
              <Area
                type="monotone"
                dataKey="forecastMW"
                stroke="#38bdf8"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#forecastGradient)"
                name="Forecast"
              />
            )}

            {/* Actual Outturn Generation Line */}
            {showActual && (
              <Line
                type="monotone"
                dataKey="actualMW"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                name="Actual"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend footnote */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded bg-cyan-400 inline-block" /> Forecast (WINDFOR Stream)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded bg-emerald-400 inline-block" /> Actual Generation (FUELHH Stream)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded bg-amber-400 inline-block" /> Prediction Error Residual (Forecast - Actual)
          </span>
        </div>
        <span className="font-mono text-slate-500">Source: Elexon BMRS Real Data Stream</span>
      </div>
    </div>
  );
}
