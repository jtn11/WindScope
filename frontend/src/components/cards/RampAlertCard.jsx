import React from 'react';
import { Zap, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatTimeOnly, formatMW } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export function RampAlertCard({ rampEvents = [], totalAlerts = 0 }) {
  const topEvent = rampEvents.length > 0 ? rampEvents[0] : null;

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Ramp Rate Monitoring
          </h3>
        </div>
        <span
          className={cn(
            'px-2 py-0.5 rounded text-[11px] font-mono font-bold border',
            totalAlerts > 0
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
              : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
          )}
        >
          {totalAlerts} RAMP {totalAlerts === 1 ? 'ALERT' : 'ALERTS'}
        </span>
      </div>

      {topEvent ? (
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Peak Ramp Shift:</span>
            <span
              className={cn(
                'text-sm font-bold font-mono flex items-center gap-1',
                topEvent.forecastDeltaMW > 0 ? 'text-cyan-400' : 'text-rose-400'
              )}
            >
              {topEvent.forecastDeltaMW > 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {formatMW(topEvent.forecastDeltaMW)}/hr
            </span>
          </div>

          <div className="mt-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Interval:</span>
              <span className="text-slate-300 font-mono">
                SP {topEvent.settlementPeriod} ({formatTimeOnly(topEvent.timestamp)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ramp Mismatch:</span>
              <span className="text-amber-400 font-mono font-semibold">
                Δ {formatMW(topEvent.rampMismatchMW)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Severity:</span>
              <span
                className={cn(
                  'font-semibold font-mono uppercase text-[10px] px-1.5 py-0.2 rounded',
                  topEvent.severity === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-amber-500/20 text-amber-400'
                )}
              >
                {topEvent.severity}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 py-4 text-center text-xs text-slate-400">
          <p className="text-emerald-400 font-medium">Stable Generation Profile</p>
          <p className="text-[11px] text-slate-500 mt-1">No rapid generation ramp anomalies detected.</p>
        </div>
      )}
    </div>
  );
}
