"use client";
import { useState } from "react";
import { RefreshCw, CheckCircle, AlertCircle, Database, Key, Activity } from "lucide-react";

interface RefreshResult {
  success?: boolean;
  error?: string;
  added?: number;
  expired?: number;
  message?: string;
}

interface StatsResult {
  totalJobs?: number;
  totalCompanies?: number;
  totalCities?: number;
  remoteJobs?: number;
  todayJobs?: number;
}

export default function AdminPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<RefreshResult | null>(null);
  const [stats, setStats] = useState<StatsResult | null>(null);

  async function triggerRefresh() {
    setRefreshing(true);
    setResult(null);
    const res = await fetch("/api/refresh", { method: "POST" });
    const data = await res.json();
    setResult(data);
    setRefreshing(false);
    // Refresh stats after job fetch
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }

  async function loadStats() {
    const data = await fetch("/api/stats").then((r) => r.json());
    setStats(data);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Refresh Admin</h1>
          <p className="text-sm text-slate-500">Manually trigger live job fetch or check current stats</p>
        </div>
      </div>

      {/* Database stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-900">Current Database Stats</h2>
          </div>
          <button onClick={loadStats} className="text-xs text-primary-600 hover:underline">Refresh</button>
        </div>
        {stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Jobs", value: stats.totalJobs },
              { label: "Companies", value: stats.totalCompanies },
              { label: "Cities", value: stats.totalCities },
              { label: "Remote", value: stats.remoteJobs },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{value ?? "—"}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        ) : (
          <button onClick={loadStats} className="w-full py-3 text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Click to load stats
          </button>
        )}
      </div>

      {/* API key status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-900">Live Job API Status</h2>
        </div>
        <p className="text-sm text-slate-600 mb-2">
          Live jobs are fetched from <strong>JSearch (RapidAPI)</strong> using the <code className="bg-slate-100 px-1 rounded text-xs">RAPIDAPI_KEY</code> env variable.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 bg-slate-100 rounded font-mono">RAPIDAPI_HOST = jsearch.p.rapidapi.com</span>
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded">Free tier: 200 req/month</span>
        </div>
      </div>

      {/* Trigger button */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-2">Manual Refresh</h2>
        <p className="text-sm text-slate-600 mb-4">
          Fetches today&apos;s jobs across 10 search queries (software, data, devops, product, etc.). Requires <code className="bg-slate-100 px-1 rounded text-xs">RAPIDAPI_KEY</code> to be set.
        </p>
        <button
          onClick={triggerRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Fetching jobs… (may take ~30s)" : "Fetch Live Jobs Now"}
        </button>

        {result && (
          <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${result.success ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            {result.success
              ? <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            }
            <div>
              <p className={`text-sm font-semibold ${result.success ? "text-emerald-800" : "text-red-800"}`}>
                {result.success ? "Success" : "Error"}
              </p>
              <p className={`text-sm mt-0.5 ${result.success ? "text-emerald-700" : "text-red-700"}`}>
                {result.message || result.error}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
