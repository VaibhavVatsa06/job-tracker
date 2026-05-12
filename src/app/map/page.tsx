"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Loader2 } from "lucide-react";
import type { Job } from "@/types";

const MapView = dynamic(() => import("@/components/MapView").then((m) => ({ default: m.MapView })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-xl">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-2" />
        <p className="text-sm text-slate-500">Loading map...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/jobs?limit=200")
      .then((r) => r.json())
      .then((d) => { setJobs(d.jobs); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const geoJobs = jobs.filter((j) => j.lat && j.lng);
  const filtered = search
    ? geoJobs.filter((j) =>
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.company.toLowerCase().includes(search.toLowerCase()) ||
        j.city.toLowerCase().includes(search.toLowerCase())
      )
    : geoJobs;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4 z-10">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <MapPin className="w-5 h-5 text-primary-600" />
          Job Map
        </div>
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by role, company or city..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="text-sm text-slate-500 ml-auto flex-shrink-0">
          {loading ? (
            <span className="flex items-center gap-1"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</span>
          ) : (
            <span><span className="font-semibold text-slate-900">{filtered.length}</span> locations on map</span>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 p-4">
        {!loading && <MapView jobs={filtered} />}
      </div>

      {/* Remote notice */}
      {!loading && jobs.filter((j) => !j.lat).length > 0 && (
        <div className="bg-purple-50 border-t border-purple-100 px-4 py-2 text-xs text-purple-700 text-center">
          🌐 {jobs.filter((j) => !j.lat).length} remote jobs not shown on map — <Link href="/jobs?jobType=Remote" className="font-semibold underline">browse them here</Link>
        </div>
      )}
    </div>
  );
}
