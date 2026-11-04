import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { History, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { formatMW, formatTimeOnly } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const PUBLISH_COLORS = [
  '#f43f5e', // 02:30 - Rose
  '#fb923c', // 04:30 - Orange
  '#eab308', // 07:30 - Yellow
  '#a855f7', // 09:30 - Purple
  '#38bdf8', // 11:30 - Sky Blue (Gate Closure Standard)
  '#06b6d4', // 15:30 - Cyan
  '#6366f1', // 18:30 - Indigo
  '#ec4899', // 22:30 - Pink
];

export function ForecastPublicationHistoryChart({
  runs = [],
  actualData = [],
  selectedPublishTime,
  onSelectPublishTime,
  height = 340,
}) {
  if (!runs || runs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 text-center text-slate-500 text-xs">
        No forecast publication history available for this delivery date.
      </div>
    );
  }

  // Combine data by startTime for the multi-line chart
  // First collect all startTimes from actuals
  const timeMap = new Map();

  actualData.forEach((act) => {
    const st = act.startTime;
    if (st) {
      const dt = new Date(st);
      const label = `${String(dt.getUTCHours()).padStart(2, '0')}:${String(dt.getUTCMinutes()).padStart(2, '0')}`;
      timeMap.set(st, {
        startTime: st,
        timeLabel: label,
        actualMW: act.actualMW,
      });
    }
  });

  // Now populate each publish run's forecastMW
  runs.forEach((run, idx) => {
    const key = `run_${idx}`;
    (run.data || []).forEach((pt) => {
      const st = pt.startTime;
      if (timeMap.has(st)) {
        const item = timeMap.get(st);
        item[key] = pt.forecastMW;
      } else {
        const dt = new Date(st);
        const label = `${String(dt.getUTCHours()).padStart(2, '0')}:${String(dt.getUTCMinutes()).padStart(2, '0')}`;
        timeMap.set(st, {
          startTime: st,
          timeLabel: label,
          [key]: pt.forecastMW,
        });
      }
    });
  });

  const chartData = Array.from(timeMap.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const pt = payload[0].payload;

    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-md text-xs font-mono min-w-[260px]">
        <div className="border-b border-slate-800 pb-1.5 mb-2 font-bold text-white flex justify-between">
          <span>{pt.timeLabel} UTC</span>
          {pt.actualMW !== undefined && (
            <span className="text-emerald-400">Actual: {formatMW(pt.actualMW)}</span>
          )}
        </div>
        <div className="space-y-1 text-[11px]">
          {runs.map((r, idx) => {
            const val = pt[`run_${idx}`];
            if (val === undefined) return null;
            const timePart = r.publishTime ? r.publishTime.slice(11, 16) : '';
            const isSelected = r.publishTime === selectedPublishTime;
            return (
              <div
                key={idx}
                className={cn(
                  'flex justify-between items-center px-1.5 py-0.5 rounded',
                  isSelected ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-300'
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: PUBLISH_COLORS[idx % PUBLISH_COLORS.length] }}
                  />
                  <span>Pub {timePart} UTC:</span>
                </span>
                <span className="font-mono">{formatMW(val)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="h-4 w-4 text-cyan-400" />
            Forecast Publication History & Evolution
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare how National Grid's day-ahead forecast updated across publication runs on D-1 leading into gate closure
          </p>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
          {runs.length} Publications Tracked
        </span>
      </div>

      {/* Evolution Chart */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              interval={3}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Actual Outturn Generation Line (Solid Emerald) */}
            <Line
              type="monotone"
              dataKey="actualMW"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
              name="Outturn Actual (FUELHH)"
            />

            {/* Multiple Forecast Publication Runs */}
            {runs.map((r, idx) => {
              const color = PUBLISH_COLORS[idx % PUBLISH_COLORS.length];
              const isSelected = r.publishTime === selectedPublishTime;
              return (
                <Line
                  key={idx}
                  type="monotone"
                  dataKey={`run_${idx}`}
                  stroke={color}
                  strokeWidth={isSelected ? 2.5 : 1.2}
                  strokeDasharray={isSelected ? undefined : '3 3'}
                  opacity={isSelected ? 1.0 : 0.6}
                  dot={false}
                  name={`Pub ${r.publishTime ? r.publishTime.slice(11, 16) : ''}`}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Publication Run Progression Table & Selector */}
      <div className="border-t border-slate-800/80 pt-3">
        <h4 className="text-xs font-semibold text-slate-300 mb-2">
          Decision Cutoff Publications (Click to inspect and activate):
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-mono">
          {runs.map((r, idx) => {
            const isSelected = r.publishTime === selectedPublishTime;
            const timePart = r.publishTime ? r.publishTime.slice(11, 16) : '';
            const color = PUBLISH_COLORS[idx % PUBLISH_COLORS.length];

            return (
              <button
                key={idx}
                onClick={() => onSelectPublishTime && onSelectPublishTime(r.publishTime)}
                className={cn(
                  'text-left p-2.5 rounded-lg border transition-all text-[11px] space-y-1',
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-400 text-white shadow-md'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    {timePart} UTC Publish
                  </span>
                  {isSelected && <span className="text-[10px] text-cyan-400 font-bold">ACTIVE</span>}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{r.cutoffLabel}</div>
                <div className="flex justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                  <span>MAE: {r.maeMW !== null ? formatMW(r.maeMW) : '—'}</span>
                  <span className={r.meanBiasMW > 0 ? 'text-amber-400' : 'text-cyan-400'}>
                    Bias: {r.meanBiasMW !== null ? `${r.meanBiasMW > 0 ? '+' : ''}${formatMW(r.meanBiasMW, false)}` : '—'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
