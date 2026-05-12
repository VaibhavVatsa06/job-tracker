"use client";
import { X, SlidersHorizontal } from "lucide-react";
import { cn, CITIES, INDUSTRIES } from "@/lib/utils";
import type { JobFilters, CompanyType, JobType } from "@/types";
import { useState } from "react";

const COMPANY_TYPES: CompanyType[] = ["MNC", "Startup", "IndianIT", "MidSize", "Government"];
const JOB_TYPES: JobType[] = ["Full-time", "Part-time", "Remote", "Hybrid"];

interface Props {
  filters: JobFilters;
  onChange: (filters: JobFilters) => void;
  totalJobs: number;
}

export function JobFilters({ filters, onChange, totalJobs }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function update<K extends keyof JobFilters>(key: K, value: JobFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  function toggleArray<T extends string>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
  }

  function clearAll() {
    onChange({ search: filters.search, minExp: 0, maxExp: 10, locations: [], companyTypes: [], jobTypes: [], industries: [], currency: "" });
  }

  const activeCount =
    filters.locations.length + filters.companyTypes.length + filters.jobTypes.length + filters.industries.length +
    (filters.minExp > 0 || filters.maxExp < 10 ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-900">Filters</p>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">{activeCount}</span>
          )}
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-xs text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1">
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>
      </div>

      <div className="text-sm text-slate-500 font-medium bg-slate-50 rounded-lg px-3 py-2">
        {totalJobs} jobs found
      </div>

      {/* Experience */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-3">Experience (years)</p>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{filters.minExp} yr</span>
            <span>{filters.maxExp >= 10 ? "10+ yr" : `${filters.maxExp} yr`}</span>
          </div>
          <input
            type="range" min={0} max={10} step={1}
            value={filters.minExp}
            onChange={(e) => update("minExp", Math.min(parseInt(e.target.value), filters.maxExp))}
            className="w-full accent-primary-600"
          />
          <input
            type="range" min={0} max={10} step={1}
            value={filters.maxExp}
            onChange={(e) => update("maxExp", Math.max(parseInt(e.target.value), filters.minExp))}
            className="w-full accent-primary-600"
          />
          <div className="flex flex-wrap gap-1 mt-2">
            {[1, 2, 3, 5, 7, 10].map((yr) => (
              <button
                key={yr}
                onClick={() => onChange({ ...filters, minExp: 0, maxExp: yr })}
                className={cn("px-2 py-0.5 rounded-full text-xs border transition-colors",
                  filters.maxExp === yr && filters.minExp === 0
                    ? "bg-primary-600 text-white border-primary-600"
                    : "text-slate-600 border-slate-200 hover:border-primary-300"
                )}
              >
                {yr === 10 ? "10+" : `≤${yr}`}yr
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Job Type */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Job Type</p>
        <div className="space-y-1.5">
          {JOB_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.jobTypes.includes(t)}
                onChange={() => update("jobTypes", toggleArray(filters.jobTypes, t))}
                className="w-4 h-4 rounded accent-primary-600"
              />
              <span className="text-sm text-slate-700 group-hover:text-primary-600 transition-colors">{t}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Company Type */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Company Type</p>
        <div className="space-y-1.5">
          {COMPANY_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.companyTypes.includes(t)}
                onChange={() => update("companyTypes", toggleArray(filters.companyTypes, t))}
                className="w-4 h-4 rounded accent-primary-600"
              />
              <span className="text-sm text-slate-700 group-hover:text-primary-600 transition-colors">{t}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Location</p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {CITIES.map((city) => (
            <label key={city} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.locations.includes(city)}
                onChange={() => update("locations", toggleArray(filters.locations, city))}
                className="w-4 h-4 rounded accent-primary-600"
              />
              <span className="text-sm text-slate-700 group-hover:text-primary-600 transition-colors">{city}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Industry */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Industry</p>
        <div className="space-y-1.5">
          {INDUSTRIES.map((ind) => (
            <label key={ind} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.industries.includes(ind)}
                onChange={() => update("industries", toggleArray(filters.industries, ind))}
                className="w-4 h-4 rounded accent-primary-600"
              />
              <span className="text-sm text-slate-700 group-hover:text-primary-600 transition-colors">{ind}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filters {activeCount > 0 && `(${activeCount})`}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative ml-auto w-80 bg-white h-full overflow-y-auto p-5 shadow-xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
            <FilterContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-24">
          <FilterContent />
        </div>
      </aside>
    </>
  );
}
