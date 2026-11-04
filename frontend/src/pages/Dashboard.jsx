import React from 'react';
import { MetricCard } from '../components/cards/MetricCard';
import { ReliabilityScoreCard } from '../components/cards/ReliabilityScoreCard';
import { GenerationForecastChart } from '../components/charts/GenerationForecastChart';
import { ForecastPublicationHistoryChart } from '../components/charts/ForecastPublicationHistoryChart';
import { SettlementDataTable } from '../components/tables/SettlementDataTable';
import { formatMW, formatPercent } from '../utils/formatters';
import {
  Wind,
  Zap,
  Activity,
  Sigma,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';

export function Dashboard({
  data = [],
  metrics,
  publicationHistory = [],
  selectedPublishTime,
  onSelectPublishTime,
  startDate = '2026-01-01',
  endDate = '2026-01-01',
  cutoff = '12:00',
  loading,
}) {
  // Extract latest point and outturn actual
  const latestForecastPoint = data.length > 0 ? data[data.length - 1] : null;
  const outturnedPoints = data.filter((d) => d.actualMW !== null && d.actualMW !== undefined);
  const latestActualPoint = outturnedPoints.length > 0 ? outturnedPoints[outturnedPoints.length - 1] : null;

  const currentFc = latestForecastPoint ? latestForecastPoint.forecastMW : 0;
  const currentAct = latestActualPoint ? latestActualPoint.actualMW : null;
  const delta = currentAct !== null ? currentFc - currentAct : null;

  const isOverForecast = metrics ? metrics.meanBiasMW > 0 : true;

  return (
    <div className="space-y-6">
      {/* Top Banner / Real Elexon Context */}
      <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-900/40 p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              Great Britain National Wind Generation Intelligence
            </h2>
            <p className="text-xs text-slate-400">
              Real Elexon BMRS data: Outturn (FUELHH) vs Day-Ahead Forecast (WINDFOR) • January 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="text-right">
            <span className="text-slate-500 block text-[10px] uppercase">Delivery Window</span>
            <span className="text-cyan-400 font-bold">
              {startDate} {startDate !== endDate ? `to ${endDate}` : ''}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="text-right">
            <span className="text-slate-500 block text-[10px] uppercase">Decision Cutoff</span>
            <span className="text-slate-200 font-bold">
              D-1 {cutoff} ({selectedPublishTime ? selectedPublishTime.slice(11, 16) + ' UTC Pub' : '11:30 Publish'})
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid: Real Metrics (Forecast, Actual, MAE, Bias, RMSE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Day-Ahead Forecast"
          value={formatMW(currentFc, false)}
          unit="MW"
          subtitle={`Total: ${metrics ? `${(metrics.totalForecastMWh / 1000).toFixed(1)} GWh` : '—'}`}
          icon={Wind}
          variant="cyan"
          trend="WINDFOR Stream"
          trendDirection="neutral"
        />

        <MetricCard
          title="Outturn Actual"
          value={currentAct !== null ? formatMW(currentAct, false) : 'Awaiting Outturn'}
          unit={currentAct !== null ? 'MW' : ''}
          subtitle={`Total: ${metrics ? `${(metrics.totalActualMWh / 1000).toFixed(1)} GWh` : '—'}`}
          icon={Zap}
          variant="emerald"
          trend={currentAct !== null ? 'FUELHH Stream' : 'Pending'}
          trendDirection="neutral"
        />

        <MetricCard
          title="Mean Absolute Error (MAE)"
          value={metrics ? formatMW(metrics.maeMW, false) : '—'}
          unit="MW"
          subtitle={`Norm: ${metrics ? metrics.nmaePercent : '0.0'}% of Peak`}
          icon={Activity}
          variant="amber"
          trend="Real Error Magnitude"
          trendDirection="neutral"
        />

        <MetricCard
          title="Forecast Bias (Mean Error)"
          value={metrics ? `${metrics.meanBiasMW > 0 ? '+' : ''}${formatMW(metrics.meanBiasMW, false)}` : '—'}
          unit="MW"
          subtitle={isOverForecast ? 'Over-forecast (Long)' : 'Under-forecast (Short)'}
          icon={isOverForecast ? TrendingUp : TrendingDown}
          variant={isOverForecast ? 'amber' : 'cyan'}
          trend={isOverForecast ? 'Forecast > Actual' : 'Actual > Forecast'}
          trendDirection={isOverForecast ? 'down' : 'up'}
        />

        <MetricCard
          title="Root Mean Squared (RMSE)"
          value={metrics ? formatMW(metrics.rmseMW, false) : '—'}
          unit="MW"
          subtitle={`Ratio: ${metrics ? (metrics.rmseMW / (metrics.maeMW || 1)).toFixed(2) : '1.0'}x MAE`}
          icon={Sigma}
          variant="slate"
          trend="Outlier Penalty"
          trendDirection="neutral"
        />
      </div>

      {/* Primary Forecast Chart: Forecast vs Actual Generation */}
      <GenerationForecastChart data={data} height={420} />

      {/* Forecast Publication History Chart */}
      <ForecastPublicationHistoryChart
        runs={publicationHistory}
        actualData={data}
        selectedPublishTime={selectedPublishTime}
        onSelectPublishTime={onSelectPublishTime}
        height={340}
      />

      {/* Procurement Reliability Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReliabilityScoreCard
          score={metrics ? metrics.reliabilityScore : 88.0}
          grade={metrics ? metrics.accuracyGrade : 'A'}
          nmae={metrics ? metrics.nmaePercent : 3.5}
          mape={metrics ? metrics.mapePercent : 7.0}
        />

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
            <Info className="h-4 w-4" />
            <span>Purchasing Decision Cutoff Analysis</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In Great Britain's wholesale electricity market, procurement teams trade on the <strong>Day-Ahead Auction (DAP)</strong> which closes at <strong>12:00 PM D-1</strong>.
          </p>
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>Active Cutoff:</span>
              <span className="text-white font-bold">12:00 D-1 (11:30 Publish)</span>
            </div>
            <div className="flex justify-between">
              <span>Evaluated Intervals:</span>
              <span className="text-cyan-400">{metrics ? metrics.dataPointCount : 0} Half-Hours</span>
            </div>
            <div className="flex justify-between">
              <span>Max Over-forecast Swing:</span>
              <span className="text-amber-400">+{metrics ? formatMW(metrics.maxOverForecastMW) : '0 MW'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settlement Data Table with CSV Export */}
      <SettlementDataTable data={data} />
    </div>
  );
}
