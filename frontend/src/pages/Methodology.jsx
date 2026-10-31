import React from 'react';
import { BookOpen, Sigma, Scale, Cpu, Database, CheckCircle2 } from 'lucide-react';

export function Methodology() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          Market Architecture & Quant Methodology
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Technical specifications for GB electricity settlement periods, forecast metrics, and financial risk models
        </p>
      </div>

      {/* Grid Architecture */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="h-4 w-4 text-cyan-400" />
          Elexon BMRS Data Ingestion & Alignment
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The platform integrates with the <strong>Elexon Balancing Mechanism Reporting Service (BMRS) API v1</strong> (the official data platform for Great Britain's electricity market).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-2">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-1">1. WINDFOR (Forecast Feed)</span>
            <p className="text-slate-400 text-[11px] font-sans">
              National Energy System Operator (NESO) aggregate day-ahead wind power forecasts published up to 8 times daily. Mapped to 48 half-hour settlement periods.
            </p>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-emerald-400 font-bold block mb-1">2. B1620 / FUELHH (Outturn Feed)</span>
            <p className="text-slate-400 text-[11px] font-sans">
              Actual metered renewable power generation broken down by fuel type: <em>Wind Offshore</em> and <em>Wind Onshore</em>. Aggregated per settlement period.
            </p>
          </div>
        </div>
      </div>

      {/* Mathematical Formulas */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sigma className="h-4 w-4 text-cyan-400" />
          Quantitative Prediction Error Metrics
        </h3>
        <p className="text-xs text-slate-300">
          Evaluated via vectorized NumPy and Pandas calculations in the backend engine:
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
              Measures the average linear magnitude of procurement volume error without directional bias.
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
              Penalizes large outlier forecast errors heavily, critical for identifying grid stability risks.
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
              Relative error percentage. Guarded against low generation denominators (&lt;10 MW) using median.
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
              Positive MBE indicates systematic over-forecasting (long risk); negative indicates under-forecasting (short risk).
            </p>
          </div>
        </div>
      </div>

      {/* Procurement Imbalance Risk Quantification */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Scale className="h-4 w-4 text-amber-400" />
          Financial Imbalance Cash-out Exposure Model
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          In the GB electricity market, party positions are reconciled against the BSC Settlement Net Imbalance Volume (NIV).
        </p>
        <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
          <p className="text-slate-300">
            <strong>Imbalance Energy (MWh):</strong> |Error MW| × 0.5 hours per Settlement Period
          </p>
          <p className="text-slate-300">
            <strong>Estimated Cashout (£):</strong> Σ (Imbalance MWh × System Imbalance Price)
          </p>
          <p className="text-[11px] text-slate-400 font-sans">
            * Calibrated with benchmark UK System Buy/Sell Price spread of £68.50/MWh.
          </p>
        </div>
      </div>
    </div>
  );
}
