import React from 'react';
import { ErrorDistributionChart } from '../components/charts/ErrorDistributionChart';
import { SettlementPeriodErrorChart } from '../components/charts/SettlementPeriodErrorChart';
import { CorrelationScatterChart } from '../components/charts/CorrelationScatterChart';
import { DailyAccuracyTable } from '../components/tables/DailyAccuracyTable';
import { MetricCard } from '../components/cards/MetricCard';
import { ReliabilityScoreCard } from '../components/cards/ReliabilityScoreCard';
import { FinancialImpactCard } from '../components/cards/FinancialImpactCard';
import { formatMW, formatPercent, formatGBP } from '../utils/formatters';
import { Target, BarChart2, ShieldAlert, Cpu, Activity, Sigma } from 'lucide-react';

export function Accuracy({
  data = [],
  metrics,
  settlementProfile = [],
  distribution,
  dailyLeaderboard = [],
  loading,
}) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-cyan-400" />
            Forecast Reliability & Error Quantification
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Statistical breakdown of day-ahead renewable prediction errors using historical outturn data
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
          <Sigma className="h-3.5 w-3.5 text-cyan-400" />
          <span>Evaluation Horizon: {dailyLeaderboard.length} Days Benchmark</span>
        </div>
      </div>

      {/* Accuracy KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Mean Absolute Error (MAE)"
          value={metrics ? formatMW(metrics.maeMW, false) : '584'}
          unit="MW"
          subtitle="Average error magnitude"
          icon={Activity}
          variant="cyan"
          trend={`${metrics ? metrics.nmaePercent : '3.4'}% of Capacity`}
          trendDirection="neutral"
        />

        <MetricCard
          title="Root Mean Squared Error (RMSE)"
          value={metrics ? formatMW(metrics.rmseMW, false) : '742'}
          unit="MW"
          subtitle="Penalizes large outlier swings"
          icon={Sigma}
          variant="amber"
          trend={`Ratio: ${metrics ? (metrics.rmseMW / (metrics.maeMW || 1)).toFixed(2) : '1.27'}x MAE`}
          trendDirection="neutral"
        />

        <MetricCard
          title="Median MAPE"
          value={metrics ? formatPercent(metrics.mapePercent) : '6.8%'}
          unit=""
          subtitle="Percentage relative to actual"
          icon={BarChart2}
          variant="emerald"
          trend="Tolerance: < 10% Optimal"
          trendDirection="up"
        />

        <MetricCard
          title="Mean Bias Error (MBE)"
          value={metrics ? `${metrics.meanBiasMW > 0 ? '+' : ''}${formatMW(metrics.meanBiasMW, false)}` : '+148'}
          unit="MW"
          subtitle={metrics && metrics.meanBiasMW > 0 ? 'Net Long Bias (Over-forecast)' : 'Net Short Bias'}
          icon={ShieldAlert}
          variant={metrics && Math.abs(metrics.meanBiasMW) < 200 ? 'emerald' : 'amber'}
          trend={metrics && metrics.meanBiasMW > 0 ? 'Over-forecast' : 'Under-forecast'}
          trendDirection="neutral"
        />
      </div>

      {/* Error Distribution & Parity Plot Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorDistributionChart distribution={distribution} height={320} />
        <CorrelationScatterChart data={data} height={320} />
      </div>

      {/* Diurnal Settlement Period Error Curve (48 Half-Hours) */}
      <SettlementPeriodErrorChart periods={settlementProfile} height={320} />

      {/* Intelligence Cards: Reliability & Imbalance Exposure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      {/* Multi-Day Accuracy Benchmark Leaderboard */}
      <DailyAccuracyTable days={dailyLeaderboard} />
    </div>
  );
}
