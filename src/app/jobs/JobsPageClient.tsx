"use client";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Bell, LayoutGrid, List } from "lucide-react";
import { JobCard } from "@/components/JobCard";
import { JobFilters } from "@/components/JobFilters";
import { AlertModal } from "@/components/AlertModal";
import type { Job, JobFilters as IFilters } from "@/types";
import { cn } from "@/lib/utils";

const DEFAULT_FILTERS: IFilters = {
  search: "", minExp: 0, maxExp: 10, locations: [], companyTypes: [], jobTypes: [], industries: [], currency: "",
};

export function JobsPageClient() {
  const params = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showAlert, setShowAlert] = useState(false);
  const [filters, setFilters] = useState<IFilters>(() => ({
    ...DEFAULT_FILTERS,
    search: params.get("search") || "",
    minExp: parseInt(params.get("minExp") || "0"),
    maxExp: parseInt(params.get("maxExp") || "10"),
    jobTypes: params.get("jobType") ? [params.get("jobType") as IFilters["jobTypes"][0]] : [],
    industries: params.get("industry") ? [decodeURIComponent(params.get("industry")!)] : [],
  }));

  const fetchJobs = useCallback(async (f: IFilters, p: number, s: string) => {
    setLoading(true);
    const q = new URLSearchParams();
    if (f.search) q.set("search", f.search);
    q.set("minExp", String(f.minExp));
    q.set("maxExp", String(f.maxExp));
    q.set("page", String(p));
    q.set("sort", s);
    f.locations.forEach((l) => q.append("location", l));
    f.companyTypes.forEach((c) => q.append("companyType", c));
    f.jobTypes.forEach((t) => q.append("jobType", t));
    f.industries.forEach((i) => q.append("industry", i));

    const res = await fetch(`/api/jobs?${q}`);
    const data = await res.json();
    setJobs(data.jobs);
    setTotal(data.total);
    setPages(data.pages);
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(filters, page, sort); }, [filters, page, sort, fetchJobs]);

  function handleFilters(f: IFilters) { setFilters(f); setPage(1); }
  function handleSort(s: string) { setSort(s); setPage(1); }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={filters.search}
            onChange={(e) => handleFilters({ ...filters, search: e.target.value })}
            placeholder="Search by role, company, skill..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>
        <div className="flex gap-2">
          <select value={sort} onChange={(e) => handleSort(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="newest">Newest first</option>
            <option value="salary">Highest salary</option>
            <option value="experience">Least experience</option>
          </select>
          <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button onClick={() => setView("grid")} className={cn("px-3 py-2.5 transition-colors", view === "grid" ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-slate-50")}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView("list")} className={cn("px-3 py-2.5 transition-colors", view === "list" ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-slate-50")}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setShowAlert(true)} className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
            <Bell className="w-4 h-4" /> Alert
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <JobFilters filters={filters} onChange={handleFilters} totalJobs={total} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">
              {loading ? "Loading..." : <><span className="font-semibold text-slate-900">{total}</span> jobs found</>}
            </p>
            <p className="text-xs text-slate-400">Page {page} of {pages}</p>
          </div>

          {loading ? (
            <div className={cn("grid gap-4", view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No jobs found</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className={cn("grid gap-4", view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1")}>
              {jobs.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors">
                Previous
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i;
                if (p < 1 || p > pages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={cn("w-10 h-10 rounded-lg text-sm font-medium transition-colors",
                      p === page ? "bg-primary-600 text-white" : "border border-slate-200 hover:bg-slate-50 text-slate-700")}>
                    {p}
                  </button>
                );
              })}
              <button disabled={page === pages} onClick={() => setPage(page + 1)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-slate-50 transition-colors">
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {showAlert && <AlertModal onClose={() => setShowAlert(false)} />}
    </div>
  );
}
