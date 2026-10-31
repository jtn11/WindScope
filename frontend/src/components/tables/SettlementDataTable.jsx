import React, { useState, useMemo } from 'react';
import {
  Download,
  Filter,
  Search,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react';
import { formatMW, formatPercent, formatTimeOnly, formatSettlementPeriodTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export function SettlementDataTable({ data = [] }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchSp, setSearchSp] = useState('');

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (filterStatus !== 'ALL' && item.status !== filterStatus) {
        return false;
      }
      if (searchSp && !item.settlementPeriod.toString().includes(searchSp)) {
        return false;
      }
      return true;
    });
  }, [data, filterStatus, searchSp]);

  const exportCSV = () => {
    if (!data.length) return;
    const headers = [
      'Timestamp (UTC)',
      'Settlement Period',
      'Forecast (MW)',
      'Actual (MW)',
      'Offshore (MW)',
      'Onshore (MW)',
      'Error (MW)',
      'Error (%)',
      'Status',
    ];

    const rows = filteredData.map((d) => [
      d.timestamp,
      d.settlementPeriod,
      d.forecastMW,
      d.actualMW !== null ? d.actualMW : '',
      d.offshoreActualMW !== null ? d.offshoreActualMW : '',
      d.onshoreActualMW !== null ? d.onshoreActualMW : '',
      d.errorMW !== null ? d.errorMW : '',
      d.percentageError !== null ? d.percentageError : '',
      d.status || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `windscope_settlement_data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status, errorMW) => {
    switch (status) {
      case 'ON_TARGET':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-2.5 w-2.5" /> ON TARGET
          </span>
        );
      case 'OVER_FORECAST':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <TrendingUp className="h-2.5 w-2.5" /> OVER (+{formatMW(errorMW, false)})
          </span>
        );
      case 'UNDER_FORECAST':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <TrendingDown className="h-2.5 w-2.5" /> UNDER ({formatMW(errorMW, false)})
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Clock className="h-2.5 w-2.5" /> DAY-AHEAD
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">Settlement Period Breakdown</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Half-hourly electricity dispatch schedule and error telemetry ({filteredData.length} records)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800/90 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ON_TARGET">On Target (±300 MW)</option>
            <option value="OVER_FORECAST">Over-forecast</option>
            <option value="UNDER_FORECAST">Under-forecast</option>
            <option value="PENDING_ACTUAL">Pending Actual</option>
          </select>

          {/* Search by Settlement Period */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Filter SP (1-48)..."
              value={searchSp}
              onChange={(e) => setSearchSp(e.target.value)}
              className="bg-slate-800/90 border border-slate-700 text-xs text-slate-200 rounded-lg pl-8 pr-3 py-1.5 w-32 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* CSV Export */}
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table body */}
      <div className="overflow-x-auto max-h-[460px]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-4">Period</th>
              <th className="py-2.5 px-4">Time (UTC)</th>
              <th className="py-2.5 px-4 text-right">Forecast</th>
              <th className="py-2.5 px-4 text-right">Actual Outturn</th>
              <th className="py-2.5 px-4 text-right">Prediction Error</th>
              <th className="py-2.5 px-4 text-right">Error %</th>
              <th className="py-2.5 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredData.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-slate-800/40 transition-colors group"
              >
                <td className="py-2.5 px-4 font-bold text-cyan-400">
                  SP {row.settlementPeriod}
                </td>
                <td className="py-2.5 px-4 text-slate-400">
                  {formatTimeOnly(row.timestamp)} ({formatSettlementPeriodTime(row.settlementPeriod)})
                </td>
                <td className="py-2.5 px-4 text-right font-medium text-white">
                  {formatMW(row.forecastMW)}
                </td>
                <td className="py-2.5 px-4 text-right font-medium text-emerald-400">
                  {row.actualMW !== null ? formatMW(row.actualMW) : '—'}
                </td>
                <td className="py-2.5 px-4 text-right font-semibold">
                  {row.errorMW !== null ? (
                    <span
                      className={
                        row.errorMW > 0
                          ? 'text-amber-400'
                          : row.errorMW < 0
                          ? 'text-rose-400'
                          : 'text-slate-300'
                      }
                    >
                      {row.errorMW > 0 ? `+${formatMW(row.errorMW)}` : formatMW(row.errorMW)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-2.5 px-4 text-right text-slate-400">
                  {row.percentageError !== null ? formatPercent(row.percentageError) : '—'}
                </td>
                <td className="py-2.5 px-4 text-center">
                  {getStatusBadge(row.status, row.errorMW)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
