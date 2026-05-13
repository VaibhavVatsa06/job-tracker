"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Loader2, ArrowLeft, Briefcase, ExternalLink, Building2, DollarSign, Clock, Globe, Linkedin } from "lucide-react";
import type { Job } from "@/types";
import { cn, formatSalary, expLabel, logoUrl, jobTypeColors, expColor, timeAgo } from "@/lib/utils";

const MapView = dynamic(() => import("@/components/MapView").then((m) => ({ default: m.MapView })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#00000f" }}>
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" />
        <p className="text-sm text-indigo-300">Loading globe...</p>
      </div>
    </div>
  ),
});

type PanelMode = "overview" | "city" | "job";

function CompanyLogo({ domain, company, size = 10 }: { domain: string | null; company: string; size?: number }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={logoUrl(domain)}
      alt={company}
      className={`w-${size} h-${size} object-contain rounded-lg`}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        if (domain && !img.src.includes("google.com")) {
          img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        } else {
          img.src = "/default-company.svg";
        }
      }}
    />
  );
}

export default function MapPage() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cityJobs, setCityJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("overview");

  useEffect(() => {
    fetch("/api/jobs?limit=500")
      .then((r) => r.json())
      .then((d) => { setAllJobs(d.jobs); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const geoJobs = allJobs.filter((j) => j.lat || j.lng || j.city);
  const filtered = search
    ? geoJobs.filter((j) =>
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.company.toLowerCase().includes(search.toLowerCase()) ||
        j.city.toLowerCase().includes(search.toLowerCase())
      )
    : geoJobs;

  const remoteCount = allJobs.filter((j) => j.jobType === "Remote" || j.city === "Remote").length;

  // City stats for overview panel
  const cityStats = Array.from(
    filtered.reduce((acc, j) => {
      if (j.city === "Remote") return acc;
      acc.set(j.city, (acc.get(j.city) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  ).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const handleSelectCity = useCallback((city: string, jobs: Job[]) => {
    setSelectedCity(city);
    setCityJobs(jobs);
    setSelectedJob(null);
    setPanelMode("city");
  }, []);

  function handleSelectJob(job: Job) {
    setSelectedJob(job);
    setPanelMode("job");
  }

  function backToCity() {
    setSelectedJob(null);
    setPanelMode("city");
  }

  function backToOverview() {
    setSelectedCity(null);
    setCityJobs([]);
    setSelectedJob(null);
    setPanelMode("overview");
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3 z-10 flex-shrink-0">
        <div className="flex items-center gap-2 font-bold text-slate-800 flex-shrink-0">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          Job Map
        </div>
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); backToOverview(); }}
            placeholder="Search role, company or city…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="hidden sm:flex items-center gap-3 ml-auto text-sm text-slate-500 flex-shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            <span><strong className="text-slate-900">{filtered.filter(j => j.city !== "Remote").length}</strong> on map</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
            <span><strong className="text-slate-900">{remoteCount}</strong> remote</span>
          </span>
        </div>
      </div>

      {/* Body: map + panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "#00000f" }}>
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-3" />
                <p className="text-indigo-300 text-sm">Loading globe…</p>
              </div>
            </div>
          ) : (
            <MapView jobs={filtered} selectedCity={selectedCity} onSelectCity={handleSelectCity} />
          )}

          {/* Globe hint overlay */}
          {!loading && panelMode === "overview" && (
            <div className="absolute bottom-4 left-4 rounded-xl px-4 py-2.5 text-xs pointer-events-none"
              style={{ background: "rgba(8,12,30,0.85)", color: "#a5b4fc", border: "1px solid rgba(129,140,248,0.3)" }}>
              🌍 Drag to rotate · Scroll to zoom · Click a dot to explore
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className={cn(
          "w-full sm:w-[380px] bg-white border-l border-slate-200 flex flex-col flex-shrink-0 overflow-hidden",
          "transition-all duration-300",
          panelMode === "overview" ? "sm:w-72" : "sm:w-[380px]"
        )}>
          {/* Overview panel */}
          {panelMode === "overview" && (
            <>
              <div className="bg-gradient-to-br from-primary-600 to-violet-600 px-5 py-5 flex-shrink-0">
                <h2 className="font-bold text-white text-lg">Job Locations</h2>
                <p className="text-primary-100 text-xs mt-0.5">{allJobs.length} jobs across {cityStats.length}+ cities</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Top Cities</p>
                {cityStats.map(([city, count]) => (
                  <button
                    key={city}
                    onClick={() => {
                      const jobs = filtered.filter(j => j.city === city);
                      handleSelectCity(city, jobs);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-primary-50 hover:text-primary-700 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700 group-hover:text-primary-700">
                      <MapPin className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                      {city}
                    </div>
                    <span className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full group-hover:border-primary-200 group-hover:text-primary-600">
                      {count} jobs
                    </span>
                  </button>
                ))}
                {remoteCount > 0 && (
                  <Link
                    href="/jobs?jobType=Remote"
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 text-sm font-medium text-purple-700">
                      <span className="text-lg">🌐</span> Remote Jobs
                    </div>
                    <span className="text-xs bg-white border border-purple-200 text-purple-600 px-2 py-0.5 rounded-full">
                      {remoteCount} jobs
                    </span>
                  </Link>
                )}
                <p className="text-xs text-slate-400 text-center pt-2">← Click a marker on the map</p>
              </div>
            </>
          )}

          {/* City jobs list panel */}
          {panelMode === "city" && (
            <>
              <div className="bg-gradient-to-br from-primary-600 to-violet-600 px-5 py-4 flex-shrink-0">
                <button onClick={backToOverview} className="flex items-center gap-1 text-primary-200 hover:text-white text-xs mb-2 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> All cities
                </button>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-200" />
                  <div>
                    <h2 className="font-bold text-white text-lg">{selectedCity}</h2>
                    <p className="text-primary-200 text-xs">{cityJobs.length} job{cityJobs.length !== 1 ? "s" : ""} available</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {cityJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className="w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <CompanyLogo domain={job.logoDomain} company={job.company} size={8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 truncate">{job.company}</p>
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-600 leading-snug line-clamp-2 transition-colors">
                          {job.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", jobTypeColors[job.jobType])}>
                            {job.jobType}
                          </span>
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", expColor(job.minExp))}>
                            {expLabel(job.minExp, job.maxExp)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-emerald-600 mt-1">
                          {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Job detail panel */}
          {panelMode === "job" && selectedJob && (
            <>
              <div className="bg-gradient-to-br from-primary-600 to-violet-600 px-5 py-4 flex-shrink-0">
                <button onClick={backToCity} className="flex items-center gap-1 text-primary-200 hover:text-white text-xs mb-3 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to {selectedCity}
                </button>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <CompanyLogo domain={selectedJob.logoDomain} company={selectedJob.company} size={10} />
                  </div>
                  <div>
                    <p className="text-primary-200 text-xs font-medium">{selectedJob.company}</p>
                    <h2 className="font-bold text-white leading-snug">{selectedJob.title}</h2>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Job meta badges */}
                <div className="px-4 py-3 flex flex-wrap gap-1.5 border-b border-slate-100">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", jobTypeColors[selectedJob.jobType])}>
                    {selectedJob.jobType}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", expColor(selectedJob.minExp))}>
                    {expLabel(selectedJob.minExp, selectedJob.maxExp)} exp
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    {selectedJob.industry}
                  </span>
                </div>

                {/* Salary + posted */}
                <div className="px-4 py-3 grid grid-cols-2 gap-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Salary</p>
                      <p className="text-xs font-semibold text-slate-800">{formatSalary(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.currency)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Posted</p>
                      <p className="text-xs font-semibold text-slate-800">{timeAgo(selectedJob.postedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Company details + social handles */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Company</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      <CompanyLogo domain={selectedJob.logoDomain} company={selectedJob.company} size={9} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{selectedJob.company}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{selectedJob.companyType} · {selectedJob.city}</span>
                      </div>
                    </div>
                  </div>
                  {/* Social / connect links */}
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.logoDomain && (
                      <a href={`https://${selectedJob.logoDomain}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                        <Globe className="w-3.5 h-3.5" /> Website
                      </a>
                    )}
                    <a
                      href={`https://www.linkedin.com/company/${selectedJob.company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
                      <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                    </a>
                    <a
                      href={`https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(selectedJob.company)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-100 rounded-lg text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> Glassdoor
                    </a>
                  </div>
                </div>

                {/* Skills */}
                {selectedJob.skills.length > 0 && (
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.skills.slice(0, 8).map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description snippet */}
                {selectedJob.description && (
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">About the Role</p>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-5">
                      {selectedJob.description.replace(/\*\*/g, "").substring(0, 320)}…
                    </p>
                  </div>
                )}

                {/* CTA buttons */}
                <div className="px-4 py-4 space-y-2">
                  <Link href={`/jobs/${selectedJob.id}`}
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-indigo-500 hover:to-blue-500 transition-all shadow-md shadow-indigo-200">
                    <Briefcase className="w-4 h-4" /> View Full Profile
                  </Link>
                  <a href={selectedJob.applyUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full border-2 border-indigo-100 text-indigo-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors">
                    <ExternalLink className="w-4 h-4" /> Apply on Company Site
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Remote jobs footer */}
      {!loading && remoteCount > 0 && panelMode !== "job" && (
        <div className="bg-purple-50 border-t border-purple-100 px-4 py-2 text-xs text-purple-700 text-center flex-shrink-0">
          🌐 {remoteCount} remote jobs not shown on map —{" "}
          <Link href="/jobs?jobType=Remote" className="font-semibold underline">browse them here</Link>
        </div>
      )}
    </div>
  );
}
