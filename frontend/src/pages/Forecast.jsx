import React from 'react';
import { GenerationForecastChart } from '../components/charts/GenerationForecastChart';
import { SettlementDataTable } from '../components/tables/SettlementDataTable';
import { MetricCard } from '../components/cards/MetricCard';
import { formatMW, formatGW, formatPercent } from '../utils/formatters';
import { Wind, Waves, Mountain, Zap, Calendar, TrendingUp } from 'lucide-react';

export function Forecast({ data = [], metrics, loading }) {
  // Compute aggregate statistics
  const offshorePoints = data.filter((d) => d.offshoreActualMW !== null && d.offshoreActualMW !== undefined);
  const totalOffshoreMW = offshorePoints.reduce((acc, p) => acc + p.offshoreActualMW, 0);
  const totalOnshoreMW = offshorePoints.reduce((acc, p) => acc + (p.onshoreActualMW || 0), 0);
  const avgOffshoreMW = offshorePoints.length ? totalOffshoreMW / offshorePoints.length : 5200;
  const avgOnshoreMW = offshorePoints.length ? totalOnshoreMW / offshorePoints.length : 3100;
  const offshoreRatio = totalOffshoreMW + totalOnshoreMW > 0 ? (totalOffshoreMW / (totalOffshoreMW + totalOnshoreMW)) * 100 : 62.5;

  const peakForecast = data.length ? Math.max(...data.map((d) => d.forecastMW)) : 16500;
  const minForecast = data.length ? Math.min(...data.map((d) => d.forecastMW)) : 2400;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wind className="h-5 w-5 text-cyan-400" />
            Day-Ahead Wind Forecast Horizon
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing expected renewable supply curve against half-hourly settlement commitments
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
          <Calendar className="h-3.5 w-3.5 text-cyan-400" />
          <span>Settlement Window: {data.length} Half-Hours ({Math.round(data.length / 2)} Hours)</span>
        </div>
      </div>

      {/* Fleet Mix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Peak Delivery Forecast"
          value={formatMW(peakForecast, false)}
          unit="MW"
          subtitle={`Min: ${formatMW(minForecast)}`}
          icon={TrendingUp}
          variant="cyan"
          trend={`${formatGW(peakForecast)} Peak`}
          trendDirection="neutral"
        />

        <MetricCard
          title="Offshore Fleet Share"
          value={formatPercent(offshoreRatio)}
          unit="of Outturn"
          subtitle={`Avg: ${formatMW(avgOffshoreMW)}`}
          icon={Waves}
          variant="emerald"
          trend="North Sea & Irish Sea"
          trendDirection="neutral"
        />

        <MetricCard
          title="Onshore Fleet Share"
          value={formatPercent(100 - offshoreRatio)}
          unit="of Outturn"
          subtitle={`Avg: ${formatMW(avgOnshoreMW)}`}
          icon={Mountain}
          variant="slate"
          trend="Scotland & England"
          trendDirection="neutral"
        />

        <MetricCard
          title="Total Energy Delivered"
          value={metrics ? `${(metrics.totalForecastMWh / 1000).toFixed(0)}` : '384'}
          unit="GWh"
          subtitle={`Actual: ${metrics ? (metrics.totalActualMWh / 1000).toFixed(0) : '362'} GWh`}
          icon={Zap}
          variant="amber"
          trend="Procured Energy"
          trendDirection="neutral"
        />
      </div>

      {/* Interactive Forecast Curve */}
      <GenerationForecastChart data={data} height={460} />

      {/* Fleet Context Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
            <Waves className="h-4 w-4 text-cyan-400" />
            Offshore Wind Characteristics (Hornsea, Dogger Bank, Seagreen)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Offshore wind constitutes over 60% of GB wind power. Its capacity factor is higher (~45-50%), but sudden frontal weather shifts can cause steep collective generation swings exceeding 2,000 MW/hr across the North Sea cluster.
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs font-mono text-slate-300">
            <span className="text-cyan-400 font-semibold">• High load factor</span>
            <span className="text-slate-400">• High ramp sensitivity</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
            <Mountain className="h-4 w-4 text-emerald-400" />
            Onshore Wind Dynamics (Scottish Highlands, Borders, Wales)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Onshore wind exhibits localized microclimate variations and transmission boundary curtailment (B6 constraint between Scotland and England). Day-ahead procurement models must watch for export limits during high Scottish wind events.
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs font-mono text-slate-300">
            <span className="text-emerald-400 font-semibold">• Boundary constraint risk</span>
            <span className="text-slate-400">• Diurnal turbulence</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <SettlementDataTable data={data} />
    </div>
  );
}
