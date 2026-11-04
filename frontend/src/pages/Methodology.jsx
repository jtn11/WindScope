import React from 'react';
import { BookOpen, Sigma, Scale, Database, Clock, Layers } from 'lucide-react';

export function Methodology() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          Market Architecture & Quantitative Methodology
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Technical specifications for Elexon BMRS API stream feeds, startTime matching, and error quantification metrics
        </p>
      </div>

      {/* Grid Architecture & Stream Feeds */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="h-4 w-4 text-cyan-400" />
          Real Elexon BMRS Stream Integration
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The platform ingests real data directly from the official <strong>Elexon Balancing Mechanism Reporting Service (BMRS) API v1</strong> stream endpoints without relying on mock values:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-2">
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-bold block mb-1">1. Forecast: WINDFOR Stream</span>
            <div className="text-[10px] text-slate-400 break-all bg-slate-900 p-1.5 rounded">
              /datasets/WINDFOR/stream?publishDateTimeFrom=...&publishDateTimeTo=...
            </div>
            <p className="text-slate-300 text-[11px] font-sans pt-1">
              National Energy System Operator (NESO) national-level wind power generation forecast, published up to 8 times daily on D-1.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="text-emerald-400 font-bold block mb-1">2. Actual Outturn: FUELHH Stream</span>
            <div className="text-[10px] text-slate-400 break-all bg-slate-900 p-1.5 rounded">
              /datasets/FUELHH/stream?settlementDateFrom=...&settlementDateTo=...&fuelType=WIND
            </div>
            <p className="text-slate-300 text-[11px] font-sans pt-1">
              Half-hourly national actual generation outturn specifically filtered for <code className="text-emerald-400">fuelType=WIND</code> across Great Britain.
            </p>
          </div>
        </div>
      </div>

      {/* StartTime Matching Logic */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="h-4 w-4 text-cyan-400" />
          Data Alignment & StartTime Matching Key
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Actual outturn generation from <strong>FUELHH</strong> is recorded on half-hourly settlement intervals (SPs 1–48), while <strong>WINDFOR</strong> forecasts provide hourly resolution blocks.
        </p>
        <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
          <p className="text-slate-300">
            <strong>Matching Key:</strong> Both datasets share the standardized ISO UTC <code className="text-cyan-400">startTime</code> attribute.
          </p>
          <p className="text-slate-300">
            <strong>Alignment Logic:</strong> For every half-hourly settlement period in FUELHH, the exact hourly WINDFOR forecast matching that delivery window is joined.
          </p>
        </div>
      </div>

      {/* Decision Cutoff Selection */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-400" />
          Purchasing Decision Cutoff (PublishTime Selection)
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          In liberalized wholesale electricity markets (EPEX SPOT, Nord Pool), procurement teams must finalize power bids at the <strong>Day-Ahead Gate Closure (12:00 PM D-1)</strong>.
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          The platform filters the WINDFOR stream using <code className="text-cyan-400">publishTime</code> to select the latest forecast issued on or before the cutoff (typically the <strong>11:30 D-1 publish</strong>). Users can also toggle earlier publications (09:30, 07:30, 04:30) or later intraday runs (15:30, 18:30, 22:30) to evaluate forecast evolution.
        </p>
      </div>

      {/* Mathematical Formulas */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sigma className="h-4 w-4 text-cyan-400" />
          Quantitative Prediction Error Metrics
        </h3>
        <p className="text-xs text-slate-300">
          Calculated dynamically from real matched data:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-cyan-400">MAE (Mean Absolute Error)</span>
              <span className="font-mono text-[10px] text-slate-500">Unit: MW</span>
            </div>
            <div className="bg-slate-900 p-2 rounded text-xs font-mono text-slate-200">
              MAE = (1/N) * Σ |Forecast_i - Actual_i|
            </div>
            <p className="text-[11px] text-slate-400">
              Measures the average magnitude of prediction error without considering error direction.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-amber-400">RMSE (Root Mean Squared Error)</span>
              <span className="font-mono text-[10px] text-slate-500">Unit: MW</span>
            </div>
            <div className="bg-slate-900 p-2 rounded text-xs font-mono text-slate-200">
              RMSE = sqrt( (1/N) * Σ (Forecast_i - Actual_i)² )
            </div>
            <p className="text-[11px] text-slate-400">
              Gives disproportionate weight to large error spikes, indicating grid balancing volatility.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-emerald-400">Median MAPE (Percentage Error)</span>
              <span className="font-mono text-[10px] text-slate-500">Unit: %</span>
            </div>
            <div className="bg-slate-900 p-2 rounded text-xs font-mono text-slate-200">
              MAPE = Median( |Forecast_i - Actual_i| / Actual_i ) * 100
            </div>
            <p className="text-[11px] text-slate-400">
              Relative error percentage. Guarded against low generation denominators using median.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-rose-400">Mean Bias Error (MBE)</span>
              <span className="font-mono text-[10px] text-slate-500">Unit: MW</span>
            </div>
            <div className="bg-slate-900 p-2 rounded text-xs font-mono text-slate-200">
              MBE = (1/N) * Σ (Forecast_i - Actual_i)
            </div>
            <p className="text-[11px] text-slate-400">
              Directional bias: Positive MBE indicates systematic over-forecasting; negative indicates under-forecasting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
