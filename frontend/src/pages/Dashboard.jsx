import React from 'react';
import { MetricCard } from '../components/cards/MetricCard';
import { ReliabilityScoreCard } from '../components/cards/ReliabilityScoreCard';
import { FinancialImpactCard } from '../components/cards/FinancialImpactCard';
import { RampAlertCard } from '../components/cards/RampAlertCard';
import { GenerationForecastChart } from '../components/charts/GenerationForecastChart';
import { SettlementDataTable } from '../components/tables/SettlementDataTable';
import { formatMW, formatGBP, formatPercent } from '../utils/formatters';
import {
  Wind,
  Zap,
  Activity,
  Coins,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export function Dashboard({ data = [], metrics, loading, ramps }) {
  // Extract latest point and outturn actual
  const latestForecastPoint = data.length > 0 ? data[data.length - 1] : null;
  const outturnedPoints = data.filter((d) => d.actualMW !== null);
  const latestActualPoint = outturnedPoints.length > 0 ? outturnedPoints[outturnedPoints.length - 1] : null;

  const currentFc = latestForecastPoint ? latestForecastPoint.forecastMW : 8540;
  const currentAct = latestActualPoint ? latestActualPoint.actualMW : 8210;
  const delta = currentFc - currentAct;

  return (
    <div className="space-y-6">
      {/* Top Banner / Market Context */}
      <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-900/40 p-4 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              Great Britain Day-Ahead Wind Generation Overview
            </h2>
            <p className="text-xs text-slate-400">
              Assessing renewable volumes against day-ahead market auctions (EPEX SPOT / Nord Pool DAP)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="text-right">
            <span className="text-slate-500 block text-[10px] uppercase">Peak Delivery Forecast</span>
            <span className="text-cyan-400 font-bold">
              {metrics ? formatMW(metrics.maxOverForecastMW + currentAct) : '16,240 MW'}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="text-right">
            <span className="text-slate-500 block text-[10px] uppercase">Est. Imbalance Exposure</span>
            <span className="text-amber-400 font-bold">
              {metrics ? formatGBP(metrics.estimatedImbalanceCostGbp) : '£82,450'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Day-Ahead Forecast"
          value={formatMW(currentFc, false)}
          unit="MW"
          subtitle="Latest GB Fleet Forecast"
          icon={Wind}
          variant="cyan"
          trend="D-1 Auction Basis"
          trendDirection="neutral"
        />

        <MetricCard
          title="Outturn Actual"
          value={latestActualPoint ? formatMW(currentAct, false) : 'Awaiting Outturn'}
          unit={latestActualPoint ? "MW" : ""}
          subtitle={latestActualPoint ? `SP ${latestActualPoint.settlementPeriod} Realized` : 'Day-ahead horizon'}
          icon={Zap}
          variant="emerald"
          trend={latestActualPoint ? `${delta > 0 ? '-' : '+'}${formatMW(Math.abs(delta))} delta` : undefined}
          trendDirection={delta > 0 ? 'down' : 'up'}
        />

        <MetricCard
          title="Mean Absolute Error (MAE)"
          value={metrics ? formatMW(metrics.maeMW, false) : '584'}
          unit="MW"
          subtitle={`RMSE: ${metrics ? formatMW(metrics.rmseMW) : '742 MW'}`}
          icon={Activity}
          variant="amber"
          trend={`${metrics ? metrics.nmaePercent : '3.4'}% Normalized`}
          trendDirection="neutral"
        />

        <MetricCard
          title="Procurement Bias"
          value={metrics ? `${metrics.meanBiasMW > 0 ? '+' : ''}${formatMW(metrics.meanBiasMW, false)}` : '+148'}
          unit="MW"
          subtitle={metrics && metrics.meanBiasMW > 0 ? 'Systematic Over-forecast' : 'Systematic Under-forecast'}
          icon={Coins}
          variant={metrics && metrics.meanBiasMW > 0 ? 'amber' : 'cyan'}
          trend={metrics && metrics.meanBiasMW > 0 ? 'Long spill risk' : 'Short cashout risk'}
          trendDirection={metrics && metrics.meanBiasMW > 0 ? 'down' : 'up'}
        />
      </div>

      {/* Primary Forecast Chart */}
      <GenerationForecastChart data={data} height={420} />

      {/* Intelligence Cards Section: Reliability + Imbalance + Ramps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReliabilityScoreCard
          score={metrics ? metrics.reliabilityScore : 89.2}
          grade={metrics ? metrics.accuracyGrade : 'A'}
          nmae={metrics ? metrics.nmaePercent : 3.4}
          mape={metrics ? metrics.mapePercent : 6.8}
        />

        <FinancialImpactCard
          estimatedCost={metrics ? metrics.estimatedImbalanceCostGbp : 82450}
          meanBias={metrics ? metrics.meanBiasMW : 148.5}
          totalActualMWh={metrics ? metrics.totalActualMWh : 362100}
        />

        <RampAlertCard
          rampEvents={ramps ? ramps.events : []}
          totalAlerts={ramps ? ramps.totalRampAlerts : (metrics ? metrics.rampRateAlertCount : 2)}
        />
      </div>

      {/* Settlement Data Table */}
      <SettlementDataTable data={data} />
    </div>
  );
}
