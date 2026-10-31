import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function Layout({
  children,
  currentTab,
  setTab,
  days,
  setDays,
  onRefresh,
  loading,
  lastUpdated,
  source,
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        days={days}
        setDays={setDays}
        onRefresh={onRefresh}
        loading={loading}
        lastUpdated={lastUpdated}
        source={source}
      />

      {/* Mobile Navigation bar */}
      <div className="lg:hidden flex overflow-x-auto bg-slate-900/90 border-b border-slate-800 px-4 py-2 gap-2 text-xs font-mono">
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'forecast', label: 'Forecast' },
          { id: 'accuracy', label: 'Accuracy' },
          { id: 'methodology', label: 'Methodology' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentTab={currentTab} setTab={setTab} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
