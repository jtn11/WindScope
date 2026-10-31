import React from 'react';
import { Coins, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { formatGBP, formatMW } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export function FinancialImpactCard({
  estimatedCost = 82450,
  meanBias = 148.5,
  totalActualMWh = 362100,
}) {
  const isOverForecast = meanBias > 0;

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Procurement Imbalance Risk
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
          @ £68.50/MWh avg
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold font-mono tracking-tight text-amber-400">
          {formatGBP(estimatedCost)}
        </span>
      </div>
      <p className="text-[11px] text-slate-400 mt-1">
        Estimated potential cashout exposure for unhedged volume error
      </p>

      <div className="mt-4 border-t border-slate-800/80 pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Portfolio Bias Bias:</span>
          <span
            className={cn(
              'font-mono font-semibold flex items-center gap-1',
              isOverForecast ? 'text-amber-400' : 'text-cyan-400'
            )}
          >
            {isOverForecast ? (
              <>
                <TrendingUp className="h-3 w-3" /> +{formatMW(meanBias)} (Over-forecast)
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3" /> {formatMW(meanBias)} (Under-forecast)
              </>
            )}
          </span>
        </div>

        <div className="mt-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50 text-[11px] text-slate-300">
          {isOverForecast ? (
            <p>
              <strong className="text-amber-400 font-semibold">Long Risk:</strong> Forecast exceeds actuals. Risk of spilled renewable volume or paying system sell price discount.
            </p>
          ) : (
            <p>
              <strong className="text-cyan-400 font-semibold">Short Risk:</strong> Actual generation exceeds forecast. May require costly peaker backfill if contracted early.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
