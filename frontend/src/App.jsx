import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Forecast } from './pages/Forecast';
import { Accuracy } from './pages/Accuracy';
import { Methodology } from './pages/Methodology';
import { useForecastData } from './hooks/useForecastData';
import { useAccuracyMetrics } from './hooks/useAccuracyMetrics';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentTab, setTab] = useState('dashboard');
  const {
    data,
    metrics,
    loading: forecastLoading,
    error: forecastError,
    days,
    setDays,
    source,
    lastUpdated,
    refresh: refreshForecast,
  } = useForecastData(2);

  const {
    summary,
    settlementProfile,
    distribution,
    ramps,
    dailyLeaderboard,
    loading: metricsLoading,
    refresh: refreshMetrics,
  } = useAccuracyMetrics();

  const handleRefreshAll = () => {
    refreshForecast();
    refreshMetrics();
  };

  const isLoading = forecastLoading || metricsLoading;

  return (
    <Layout
      currentTab={currentTab}
      setTab={setTab}
      days={days}
      setDays={setDays}
      onRefresh={handleRefreshAll}
      loading={isLoading}
      lastUpdated={lastUpdated}
      source={source}
    >
      {/* Alert banner if error occurred */}
      {forecastError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-400" />
            <span>
              Live upstream notice: {forecastError}. Using resilient GB Grid simulation fallback.
            </span>
          </div>
          <button
            onClick={handleRefreshAll}
            className="underline font-semibold hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Tab Views */}
      {currentTab === 'dashboard' && (
        <Dashboard
          data={data}
          metrics={metrics || summary}
          loading={isLoading}
          ramps={ramps}
        />
      )}

      {currentTab === 'forecast' && (
        <Forecast
          data={data}
          metrics={metrics || summary}
          loading={isLoading}
        />
      )}

      {currentTab === 'accuracy' && (
        <Accuracy
          data={data}
          metrics={metrics || summary}
          settlementProfile={settlementProfile}
          distribution={distribution}
          dailyLeaderboard={dailyLeaderboard}
          loading={isLoading}
        />
      )}

      {currentTab === 'methodology' && <Methodology />}
    </Layout>
  );
}
