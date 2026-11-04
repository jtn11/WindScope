import React from 'react';
import { GenerationForecastChart } from '../components/charts/GenerationForecastChart';
import { ForecastPublicationHistoryChart } from '../components/charts/ForecastPublicationHistoryChart';
import { SettlementDataTable } from '../components/tables/SettlementDataTable';
import { MetricCard } from '../components/cards/MetricCard';
import { formatMW, formatGW, formatPercent } from '../utils/formatters';
import { Wind, Zap, Activity, Calendar, History, TrendingUp, TrendingDown } from 'lucide-react';

export function Forecast({
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
  const peakForecast = data.length ? Math.max(...data.map((d) => d.forecastMW || 0)) : 0;
  const minForecast = data.length ? Math.min(...data.map((d) => d.forecastMW || 0)) : 0;
  const actualsList = data.filter((d) => d.actualMW !== null && d.actualMW !== undefined);
  const peakActual = actualsList.length ? Math.max(...actualsList.map((d) => d.actualMW)) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wind className="h-5 w-5 text-cyan-400" />
            Day-Ahead Wind Forecast Horizon (January 2026)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            National-level wind generation forecast (WINDFOR) matched against outturn (FUELHH) • Decision Cutoff D-1 {cutoff}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
          <Calendar className="h-3.5 w-3.5 text-cyan-400" />
          <span>Delivery Window: {startDate} {startDate !== endDate ? `to ${endDate}` : ''}</span>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Peak Forecast Generation"
          value={formatMW(peakForecast, false)}
          unit="MW"
          subtitle={`Min: ${formatMW(minForecast)}`}
          icon={TrendingUp}
          variant="cyan"
          trend={`${formatGW(peakForecast)} Peak`}
          trendDirection="neutral"
        />

        <MetricCard
          title="Peak Outturn Realized"
          value={peakActual > 0 ? formatMW(peakActual, false) : 'Awaiting Outturn'}
          unit={peakActual > 0 ? 'MW' : ''}
          subtitle={`Delta: ${peakActual > 0 ? formatMW(peakForecast - peakActual) : '—'}`}
          icon={Zap}
          variant="emerald"
          trend="FUELHH Stream"
          trendDirection="neutral"
        />

        <MetricCard
          title="Total Forecast Energy"
          value={metrics ? `${(metrics.totalForecastMWh / 1000).toFixed(1)}` : '0'}
          unit="GWh"
          subtitle={`Actual: ${metrics ? (metrics.totalActualMWh / 1000).toFixed(1) : '0'} GWh`}
          icon={Activity}
          variant="amber"
          trend="Day-Ahead Commitment"
          trendDirection="neutral"
        />

        <MetricCard
          title="Mean Bias Error"
          value={metrics ? `${metrics.meanBiasMW > 0 ? '+' : ''}${formatMW(metrics.meanBiasMW, false)}` : '0'}
          unit="MW"
          subtitle={metrics && metrics.meanBiasMW > 0 ? 'Over-forecast' : 'Under-forecast'}
          icon={metrics && metrics.meanBiasMW > 0 ? TrendingUp : TrendingDown}
          variant={metrics && metrics.meanBiasMW > 0 ? 'amber' : 'cyan'}
          trend={`MAE: ${metrics ? formatMW(metrics.maeMW) : '0 MW'}`}
          trendDirection="neutral"
        />
      </div>

      {/* Interactive Forecast Curve */}
      <GenerationForecastChart data={data} height={440} />

      {/* Forecast Publication History & Evolution */}
      <ForecastPublicationHistoryChart
        runs={publicationHistory}
        actualData={data}
        selectedPublishTime={selectedPublishTime}
        onSelectPublishTime={onSelectPublishTime}
        height={340}
      />

      {/* Settlement Period Table */}
      <SettlementDataTable data={data} />
    </div>
  );
}
