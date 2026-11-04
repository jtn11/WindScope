import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Forecast } from './pages/Forecast';
import { Accuracy } from './pages/Accuracy';
import { Methodology } from './pages/Methodology';
import { useForecastData } from './hooks/useForecastData';
import { useAccuracyMetrics } from './hooks/useAccuracyMetrics';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setTab] = useState('dashboard');

  const {
    data,
    metrics,
    loading: forecastLoading,
    error: forecastError,
    startDate,
    endDate,
    cutoff,
    selectedPublishTime,
    availablePublishTimes,
    publicationHistory,
    setCutoff,
    setSelectedPublishTime,
    setDateRange,
    source,
    lastUpdated,
    refresh: refreshForecast,
  } = useForecastData('2026-01-01', '2026-01-01');

  const {
    summary,
    settlementProfile,
    distribution,
    dailyLeaderboard,
    loading: metricsLoading,
    refresh: refreshMetrics,
  } = useAccuracyMetrics(startDate, endDate, cutoff);

  const handleRefreshAll = () => {
    refreshForecast();
    refreshMetrics();
  };

  const isLoading = forecastLoading || metricsLoading;

  return (
    <Layout
      currentTab={currentTab}
      setTab={setTab}
      startDate={startDate}
      endDate={endDate}
      setDateRange={setDateRange}
      cutoff={cutoff}
      setCutoff={setCutoff}
      onRefresh={handleRefreshAll}
      loading={isLoading}
      lastUpdated={lastUpdated}
      source={source}
    >
      {/* Alert banner if error occurred */}
      {forecastError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
            <span>
              Elexon Stream API notice: {forecastError}.
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
          publicationHistory={publicationHistory}
          selectedPublishTime={selectedPublishTime}
          onSelectPublishTime={setSelectedPublishTime}
          startDate={startDate}
          endDate={endDate}
          cutoff={cutoff}
          loading={isLoading}
        />
      )}

      {currentTab === 'forecast' && (
        <Forecast
          data={data}
          metrics={metrics || summary}
          publicationHistory={publicationHistory}
          selectedPublishTime={selectedPublishTime}
          onSelectPublishTime={setSelectedPublishTime}
          startDate={startDate}
          endDate={endDate}
          cutoff={cutoff}
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
          startDate={startDate}
          endDate={endDate}
          loading={isLoading}
        />
      )}

      {currentTab === 'methodology' && <Methodology />}
    </Layout>
  );
}
