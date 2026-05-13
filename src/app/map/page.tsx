"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, MapPin, Loader2, ArrowLeft, Briefcase,
  ExternalLink, Building2, DollarSign, Clock, Globe, Linkedin, X,
} from "lucide-react";
import type { Job } from "@/types";
import { cn, formatSalary, expLabel, logoUrl, jobTypeColors, expColor, timeAgo } from "@/lib/utils";

const MapView = dynamic(
  () => import("@/components/MapView").then((m) => ({ default: m.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center" style={{ background: "#060914" }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: "#22d3ee" }} />
          <p className="text-sm" style={{ color: "#22d3ee" }}>Loading globe…</p>
        </div>
      </div>
    ),
  }
);

type PanelMode = "overview" | "city" | "job";
type JobTypeFilter = "All" | "Remote" | "Hybrid" | "Full-time";
type ExpFilter = "All" | "Fresher" | "Mid" | "Senior";

const JOB_TYPE_FILTERS: JobTypeFilter[] = ["All", "Remote", "Hybrid", "Full-time"];
const EXP_FILTERS: ExpFilter[] = ["All", "Fresher", "Mid", "Senior"];

const DARK = {
  bg: "#060914",
  panel: "rgba(5,9,22,0.97)",
  card: "rgba(8,13,28,0.9)",
  cardHover: "rgba(12,18,38,0.95)",
  border: "rgba(34,211,238,0.12)",
  borderStrong: "rgba(34,211,238,0.25)",
  cyan: "#22d3ee",
  cyanDim: "rgba(34,211,238,0.15)",
  amber: "#fbbf24",
  text: "#f1f5f9",
  textSub: "#94a3b8",
  textDim: "#475569",
} as const;

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

function FilterPill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 13px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: active ? 700 : 500,
        border: `1px solid ${active ? DARK.cyan : DARK.border}`,
        background: active ? DARK.cyanDim : "rgba(255,255,255,0.03)",
        color: active ? DARK.cyan : DARK.textSub,
        cursor: "pointer",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap" as const,
      }}
    >
      {label}
    </button>
  );
}

export default function MapPage() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState<JobTypeFilter>("All");
  const [expFilter, setExpFilter] = useState<ExpFilter>("All");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cityJobs, setCityJobs] = useState<Job[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("overview");

  useEffect(() => {
    fetch("/api/jobs?limit=500")
      .then((r) => r.json())
      .then((d) => { setAllJobs(d.jobs ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const geoJobs = allJobs.filter((j) => j.lat || j.lng || j.city);

  const filtered = useMemo(() => {
    let jobs = geoJobs;
    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter((j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.city.toLowerCase().includes(q)
      );
    }
    if (jobTypeFilter !== "All") {
      jobs = jobs.filter((j) => j.jobType === jobTypeFilter);
    }
    if (expFilter !== "All") {
      jobs = jobs.filter((j) => {
        const min = j.minExp ?? 0;
        const max = j.maxExp ?? 99;
        if (expFilter === "Fresher") return min <= 1;
        if (expFilter === "Mid") return min >= 2 && max <= 5;
        if (expFilter === "Senior") return min >= 6 || max >= 6;
        return true;
      });
    }
    return jobs;
  }, [geoJobs, search, jobTypeFilter, expFilter]);

  const remoteCount = allJobs.filter((j) => j.jobType === "Remote" || j.city === "Remote").length;

  const cityStats = useMemo(() =>
    Array.from(
      filtered.reduce((acc, j) => {
        if (!j.city || j.city === "Remote") return acc;
        acc.set(j.city, (acc.get(j.city) || 0) + 1);
        return acc;
      }, new Map<string, number>())
    ).sort((a, b) => b[1] - a[1]).slice(0, 10),
    [filtered]
  );

  // Company breakdown for the selected city
  const cityCompanies = useMemo(() => {
    if (!cityJobs.length) return [];
    return Array.from(
      cityJobs.reduce((acc, j) => {
        const key = j.company;
        if (!acc.has(key)) acc.set(key, { name: key, domain: j.logoDomain, count: 0 });
        acc.get(key)!.count++;
        return acc;
      }, new Map<string, { name: string; domain: string | null; count: number }>())
        .values()
    ).sort((a, b) => b.count - a.count);
  }, [cityJobs]);

  const filteredCityJobs = useMemo(() =>
    selectedCompany
      ? cityJobs.filter((j) => j.company === selectedCompany)
      : cityJobs,
    [cityJobs, selectedCompany]
  );

  const handleSelectCity = useCallback((city: string, jobs: Job[]) => {
    setSelectedCity(city);
    setCityJobs(jobs);
    setSelectedJob(null);
    setSelectedCompany(null);
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
    setSelectedCompany(null);
    setPanelMode("overview");
  }

  const panelWidth = panelMode === "overview" ? "288px" : "380px";

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 64px)", background: DARK.bg }}
    >
      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <div
        className="px-4 py-2.5 flex items-center gap-3 flex-shrink-0 border-b z-20"
        style={{ background: DARK.panel, borderColor: DARK.border }}
      >
        <div
          className="flex items-center gap-2 font-bold flex-shrink-0"
          style={{ color: DARK.text }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #0891b2, #4f46e5)",
              boxShadow: "0 0 10px rgba(34,211,238,0.4)",
            }}
          >
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <span style={{ color: DARK.text }}>Job Map</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-sm relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: DARK.textDim }}
          />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); backToOverview(); }}
            placeholder="Search role, company or city…"
            style={{
              width: "100%",
              paddingLeft: "36px",
              paddingRight: "36px",
              paddingTop: "7px",
              paddingBottom: "7px",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${DARK.border}`,
              borderRadius: "10px",
              fontSize: "13px",
              color: DARK.text,
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = DARK.borderStrong)}
            onBlur={(e) => (e.target.style.borderColor = DARK.border)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: DARK.textDim }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Stats */}
        <div
          className="hidden sm:flex items-center gap-4 ml-auto text-sm flex-shrink-0"
          style={{ color: DARK.textSub }}
        >
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: DARK.cyan, boxShadow: `0 0 6px ${DARK.cyan}` }}
            />
            <span>
              <strong style={{ color: DARK.text }}>
                {filtered.filter((j) => j.city !== "Remote").length}
              </strong>{" "}
              on map
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: "#a78bfa", boxShadow: "0 0 6px rgba(167,139,250,0.6)" }}
            />
            <span>
              <strong style={{ color: DARK.text }}>{remoteCount}</strong> remote
            </span>
          </span>
        </div>
      </div>

      {/* ── Filter row ────────────────────────────────────────────────── */}
      <div
        className="px-4 py-2 flex items-center gap-2 flex-shrink-0 border-b overflow-x-auto"
        style={{ background: "rgba(4,7,18,0.95)", borderColor: DARK.border }}
      >
        <span
          className="text-xs font-semibold flex-shrink-0 mr-1"
          style={{ color: DARK.textDim }}
        >
          Type:
        </span>
        {JOB_TYPE_FILTERS.map((f) => (
          <FilterPill
            key={f}
            label={f}
            active={jobTypeFilter === f}
            onClick={() => { setJobTypeFilter(f); backToOverview(); }}
          />
        ))}
        <div
          className="w-px h-4 flex-shrink-0 mx-1"
          style={{ background: DARK.border }}
        />
        <span
          className="text-xs font-semibold flex-shrink-0 mr-1"
          style={{ color: DARK.textDim }}
        >
          Exp:
        </span>
        {EXP_FILTERS.map((f) => (
          <FilterPill
            key={f}
            label={f}
            active={expFilter === f}
            onClick={() => { setExpFilter(f); backToOverview(); }}
          />
        ))}
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Globe */}
        <div className="flex-1 relative">
          {loading ? (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: DARK.bg }}
            >
              <div className="text-center">
                <div
                  className="relative w-16 h-16 mx-auto mb-4"
                  style={{
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)",
                    boxShadow: "0 0 40px rgba(34,211,238,0.2)",
                  }}
                >
                  <Loader2
                    className="w-8 h-8 animate-spin absolute inset-0 m-auto"
                    style={{ color: DARK.cyan }}
                  />
                </div>
                <p className="text-sm font-medium" style={{ color: DARK.cyan }}>
                  Loading global job data…
                </p>
                <p className="text-xs mt-1" style={{ color: DARK.textDim }}>
                  Mapping {allJobs.length || "…"} opportunities
                </p>
              </div>
            </div>
          ) : (
            <MapView
              jobs={filtered}
              selectedCity={selectedCity}
              onSelectCity={handleSelectCity}
            />
          )}

          {/* Hint overlay */}
          {!loading && panelMode === "overview" && (
            <div
              className="absolute bottom-4 left-4 px-4 py-2 rounded-xl text-xs pointer-events-none"
              style={{
                background: "rgba(4,8,20,0.88)",
                color: DARK.cyan,
                border: `1px solid ${DARK.border}`,
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              }}
            >
              🌐 Drag to rotate · Scroll to zoom · Click a marker to explore
            </div>
          )}
        </div>

        {/* ── Right panel ─────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 flex flex-col overflow-hidden transition-all duration-300"
          style={{
            width: panelWidth,
            background: DARK.panel,
            borderLeft: `1px solid ${DARK.border}`,
          }}
        >
          {/* ── Overview ── */}
          {panelMode === "overview" && (
            <>
              <div
                className="px-5 py-4 flex-shrink-0 border-b"
                style={{ borderColor: DARK.border }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <div
                    className="w-1 h-5 rounded-full"
                    style={{ background: DARK.cyan, boxShadow: `0 0 8px ${DARK.cyan}` }}
                  />
                  <h2 className="font-bold text-base" style={{ color: DARK.text }}>
                    Job Locations
                  </h2>
                </div>
                <p className="text-xs ml-3" style={{ color: DARK.textSub }}>
                  {allJobs.length} jobs · {cityStats.length}+ cities worldwide
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                <p
                  className="text-xs font-semibold uppercase tracking-wider px-2 pb-1"
                  style={{ color: DARK.textDim }}
                >
                  Top Cities
                </p>
                {cityStats.map(([city, count]) => (
                  <button
                    key={city}
                    onClick={() => {
                      const jobs = filtered.filter((j) => j.city === city);
                      handleSelectCity(city, jobs);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group"
                    style={{ background: DARK.card, border: `1px solid ${DARK.border}` }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = DARK.borderStrong;
                      (e.currentTarget as HTMLElement).style.background = DARK.cardHover;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = DARK.border;
                      (e.currentTarget as HTMLElement).style.background = DARK.card;
                    }}
                  >
                    <div
                      className="flex items-center gap-2 text-sm font-medium"
                      style={{ color: DARK.textSub }}
                    >
                      <MapPin className="w-3.5 h-3.5" style={{ color: DARK.cyan }} />
                      <span style={{ color: DARK.text }}>{city}</span>
                    </div>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: DARK.cyanDim,
                        color: DARK.cyan,
                        border: `1px solid ${DARK.border}`,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                ))}

                {remoteCount > 0 && (
                  <Link
                    href="/jobs?jobType=Remote"
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                    style={{
                      background: "rgba(124,58,237,0.08)",
                      border: "1px solid rgba(124,58,237,0.2)",
                    }}
                  >
                    <div
                      className="flex items-center gap-2 text-sm font-medium"
                      style={{ color: "#a78bfa" }}
                    >
                      <span>🌐</span> Remote Jobs
                    </div>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(124,58,237,0.15)",
                        color: "#a78bfa",
                        border: "1px solid rgba(124,58,237,0.25)",
                      }}
                    >
                      {remoteCount}
                    </span>
                  </Link>
                )}

                <p
                  className="text-xs text-center pt-3"
                  style={{ color: DARK.textDim }}
                >
                  ← Click a marker on the globe
                </p>
              </div>
            </>
          )}

          {/* ── City Panel ── */}
          {panelMode === "city" && (
            <>
              <div
                className="px-5 py-4 flex-shrink-0 border-b"
                style={{ borderColor: DARK.border }}
              >
                <button
                  onClick={backToOverview}
                  className="flex items-center gap-1 text-xs mb-3 transition-colors"
                  style={{ color: DARK.textDim }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = DARK.cyan)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = DARK.textDim)}
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> All cities
                </button>
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: DARK.cyanDim,
                      border: `1px solid ${DARK.borderStrong}`,
                    }}
                  >
                    <MapPin className="w-4 h-4" style={{ color: DARK.cyan }} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg leading-tight" style={{ color: DARK.text }}>
                      {selectedCity}
                    </h2>
                    <p className="text-xs" style={{ color: DARK.textSub }}>
                      {cityJobs.length} opening{cityJobs.length !== 1 ? "s" : ""}
                      {selectedCompany && ` · ${filteredCityJobs.length} from ${selectedCompany}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Company filter chips */}
              {cityCompanies.length > 1 && (
                <div
                  className="px-3 py-2.5 flex gap-2 overflow-x-auto flex-shrink-0 border-b"
                  style={{ borderColor: DARK.border }}
                >
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 transition-all"
                    style={{
                      background: !selectedCompany ? DARK.cyanDim : "rgba(255,255,255,0.04)",
                      border: `1px solid ${!selectedCompany ? DARK.cyan : DARK.border}`,
                      color: !selectedCompany ? DARK.cyan : DARK.textSub,
                    }}
                  >
                    All
                  </button>
                  {cityCompanies.slice(0, 5).map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedCompany(selectedCompany === c.name ? null : c.name)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 transition-all"
                      style={{
                        background: selectedCompany === c.name ? DARK.cyanDim : "rgba(255,255,255,0.04)",
                        border: `1px solid ${selectedCompany === c.name ? DARK.cyan : DARK.border}`,
                        color: selectedCompany === c.name ? DARK.cyan : DARK.textSub,
                      }}
                    >
                      {c.domain && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={`https://logo.clearbit.com/${c.domain}`}
                          width={12}
                          height={12}
                          alt={c.name}
                          className="rounded-sm"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      {c.name.length > 14 ? c.name.slice(0, 13) + "…" : c.name}
                      <span style={{ opacity: 0.7 }}>({c.count})</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: DARK.border }}>
                {filteredCityJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className="w-full text-left px-4 py-3.5 transition-all"
                    style={{ borderColor: DARK.border }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(34,211,238,0.04)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: `1px solid ${DARK.border}`,
                        }}
                      >
                        <CompanyLogo domain={job.logoDomain} company={job.company} size={8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate" style={{ color: DARK.textSub }}>
                          {job.company}
                        </p>
                        <p
                          className="text-sm font-semibold leading-snug line-clamp-2"
                          style={{ color: DARK.text }}
                        >
                          {job.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              jobTypeColors[job.jobType]
                            )}
                          >
                            {job.jobType}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              expColor(job.minExp)
                            )}
                          >
                            {expLabel(job.minExp, job.maxExp)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold mt-1" style={{ color: "#34d399" }}>
                          {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredCityJobs.length === 0 && (
                  <div className="px-4 py-8 text-center" style={{ color: DARK.textDim }}>
                    <p className="text-sm">No jobs match the current filters.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Job Detail ── */}
          {panelMode === "job" && selectedJob && (
            <>
              {/* Header */}
              <div
                className="px-5 py-4 flex-shrink-0 border-b"
                style={{ borderColor: DARK.border }}
              >
                <button
                  onClick={backToCity}
                  className="flex items-center gap-1 text-xs mb-3 transition-colors"
                  style={{ color: DARK.textDim }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = DARK.cyan)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = DARK.textDim)}
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to {selectedCity}
                </button>
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${DARK.borderStrong}`,
                    }}
                  >
                    <CompanyLogo domain={selectedJob.logoDomain} company={selectedJob.company} size={10} />
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: DARK.cyan }}>
                      {selectedJob.company}
                    </p>
                    <h2 className="font-bold text-sm leading-snug" style={{ color: DARK.text }}>
                      {selectedJob.title}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Badges */}
                <div
                  className="px-4 py-3 flex flex-wrap gap-1.5 border-b"
                  style={{ borderColor: DARK.border }}
                >
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", jobTypeColors[selectedJob.jobType])}>
                    {selectedJob.jobType}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", expColor(selectedJob.minExp))}>
                    {expLabel(selectedJob.minExp, selectedJob.maxExp)} exp
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: DARK.textSub,
                      border: `1px solid ${DARK.border}`,
                    }}
                  >
                    {selectedJob.industry}
                  </span>
                </div>

                {/* Salary + Posted */}
                <div
                  className="px-4 py-3 grid grid-cols-2 gap-3 border-b"
                  style={{ borderColor: DARK.border }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}
                    >
                      <DollarSign className="w-3.5 h-3.5" style={{ color: "#34d399" }} />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: DARK.textDim }}>Salary</p>
                      <p className="text-xs font-semibold" style={{ color: DARK.text }}>
                        {formatSalary(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.currency)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${DARK.border}` }}
                    >
                      <Clock className="w-3.5 h-3.5" style={{ color: DARK.textSub }} />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: DARK.textDim }}>Posted</p>
                      <p className="text-xs font-semibold" style={{ color: DARK.text }}>
                        {timeAgo(selectedJob.postedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Company section */}
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: DARK.border }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: DARK.textDim }}
                  >
                    Company
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: `1px solid ${DARK.border}`,
                      }}
                    >
                      <CompanyLogo domain={selectedJob.logoDomain} company={selectedJob.company} size={9} />
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: DARK.text }}>
                        {selectedJob.company}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3 h-3" style={{ color: DARK.textDim }} />
                        <span className="text-xs" style={{ color: DARK.textSub }}>
                          {selectedJob.companyType} · {selectedJob.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Social links */}
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.logoDomain && (
                      <a
                        href={`https://${selectedJob.logoDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: `1px solid ${DARK.border}`,
                          color: DARK.textSub,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = DARK.borderStrong;
                          (e.currentTarget as HTMLElement).style.color = DARK.text;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = DARK.border;
                          (e.currentTarget as HTMLElement).style.color = DARK.textSub;
                        }}
                      >
                        <Globe className="w-3.5 h-3.5" /> Website
                      </a>
                    )}
                    <a
                      href={`https://www.linkedin.com/company/${selectedJob.company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: "rgba(10,102,194,0.12)",
                        border: "1px solid rgba(10,102,194,0.25)",
                        color: "#60a5fa",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(10,102,194,0.2)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(10,102,194,0.12)")}
                    >
                      <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                    </a>
                    <a
                      href={`https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(selectedJob.company)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: "rgba(52,211,153,0.08)",
                        border: "1px solid rgba(52,211,153,0.2)",
                        color: "#34d399",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(52,211,153,0.15)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(52,211,153,0.08)")}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Glassdoor
                    </a>
                  </div>
                </div>

                {/* Skills */}
                {selectedJob.skills.length > 0 && (
                  <div
                    className="px-4 py-3 border-b"
                    style={{ borderColor: DARK.border }}
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: DARK.textDim }}
                    >
                      Required Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.skills.slice(0, 8).map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: "rgba(99,102,241,0.12)",
                            color: "#a5b4fc",
                            border: "1px solid rgba(99,102,241,0.2)",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedJob.description && (
                  <div
                    className="px-4 py-3 border-b"
                    style={{ borderColor: DARK.border }}
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: DARK.textDim }}
                    >
                      About the Role
                    </p>
                    <p className="text-xs leading-relaxed line-clamp-5" style={{ color: DARK.textSub }}>
                      {selectedJob.description.replace(/\*\*/g, "").substring(0, 320)}…
                    </p>
                  </div>
                )}

                {/* CTAs */}
                <div className="px-4 py-4 space-y-2">
                  <a
                    href={selectedJob.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: "linear-gradient(135deg, #0891b2, #4f46e5)",
                      color: "white",
                      boxShadow: "0 0 20px rgba(34,211,238,0.3), 0 4px 14px rgba(0,0,0,0.5)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    <ExternalLink className="w-4 h-4" /> Apply Now
                  </a>
                  <Link
                    href={`/jobs/${selectedJob.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: "transparent",
                      border: `1.5px solid ${DARK.border}`,
                      color: DARK.textSub,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = DARK.borderStrong;
                      (e.currentTarget as HTMLElement).style.color = DARK.text;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = DARK.border;
                      (e.currentTarget as HTMLElement).style.color = DARK.textSub;
                    }}
                  >
                    <Briefcase className="w-4 h-4" /> View Full Details
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Remote footer ─────────────────────────────────────────────── */}
      {!loading && remoteCount > 0 && panelMode !== "job" && (
        <div
          className="px-4 py-2 text-xs text-center flex-shrink-0 border-t"
          style={{
            background: "rgba(124,58,237,0.06)",
            borderColor: "rgba(124,58,237,0.15)",
            color: "#a78bfa",
          }}
        >
          🌐 {remoteCount} remote jobs not shown on map —{" "}
          <Link href="/jobs?jobType=Remote" className="font-bold underline">
            browse them here
          </Link>
        </div>
      )}
    </div>
  );
}
