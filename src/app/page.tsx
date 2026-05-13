"use client";
import Link from "next/link";
import { useState } from "react";
import { Search, MapPin, Briefcase, Bell, ArrowRight, Zap, Globe, Building2, TrendingUp, Shield } from "lucide-react";
import { StatsSection } from "@/components/StatsSection";
import { AlertModal } from "@/components/AlertModal";

const QUICK_FILTERS = [
  { label: "Fresher (0-1yr)", href: "/jobs?minExp=0&maxExp=1" },
  { label: "Junior (1-3yr)", href: "/jobs?minExp=1&maxExp=3" },
  { label: "Mid-level (3-5yr)", href: "/jobs?minExp=3&maxExp=5" },
  { label: "Senior (5-8yr)", href: "/jobs?minExp=5&maxExp=8" },
  { label: "Lead / Staff (8+yr)", href: "/jobs?minExp=8&maxExp=10" },
  { label: "Remote Jobs", href: "/jobs?jobType=Remote" },
];

const FEATURED_ROLES = [
  {
    icon: "⚙️",
    role: "Software Engineering",
    href: "/jobs?industry=Software+Engineering",
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    badge: "Most Popular",
  },
  {
    icon: "🤖",
    role: "Data & AI",
    href: "/jobs?industry=Data+%26+AI",
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    badge: "Hot",
  },
  {
    icon: "☁️",
    role: "DevOps & Cloud",
    href: "/jobs?industry=DevOps+%26+Cloud",
    gradient: "from-cyan-500 to-teal-600",
    bg: "bg-cyan-50",
    badge: null,
  },
  {
    icon: "🔐",
    role: "Cybersecurity",
    href: "/jobs?industry=Cybersecurity",
    gradient: "from-red-500 to-rose-600",
    bg: "bg-red-50",
    badge: null,
  },
  {
    icon: "📊",
    role: "Product Management",
    href: "/jobs?industry=Product+Management",
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    badge: null,
  },
  {
    icon: "🎨",
    role: "Design",
    href: "/jobs?industry=Design",
    gradient: "from-pink-500 to-fuchsia-600",
    bg: "bg-pink-50",
    badge: null,
  },
  {
    icon: "💰",
    role: "Finance & Fintech",
    href: "/jobs?industry=Finance+%26+Fintech",
    gradient: "from-emerald-500 to-green-600",
    bg: "bg-emerald-50",
    badge: null,
  },
  {
    icon: "📣",
    role: "Sales & Marketing",
    href: "/jobs?industry=Sales+%26+Marketing",
    gradient: "from-orange-500 to-red-500",
    bg: "bg-orange-50",
    badge: null,
  },
];

const FEATURED_COMPANIES = [
  { name: "Google", domain: "google.com" },
  { name: "Microsoft", domain: "microsoft.com" },
  { name: "Amazon", domain: "amazon.com" },
  { name: "Razorpay", domain: "razorpay.com" },
  { name: "CRED", domain: "cred.club" },
  { name: "Swiggy", domain: "swiggy.com" },
  { name: "Infosys", domain: "infosys.com" },
  { name: "Wipro", domain: "wipro.com" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) window.location.href = `/jobs?search=${encodeURIComponent(search)}`;
  }

  return (
    <div className="bg-slate-50 min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4f46e5]">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-blue-400/10 blur-3xl" />
        </div>
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 px-4 py-1.5 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-white/20 shadow-inner">
            <Zap className="w-4 h-4 text-yellow-300" />
            Updated daily — new jobs posted every morning
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.12] mb-5 tracking-tight">
            Find Your Next<br />
            <span className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent">
              Dream Role
            </span>
          </h1>
          <p className="text-lg text-indigo-200 mb-9 max-w-2xl mx-auto leading-relaxed">
            Curated jobs from top startups, MNCs and Indian IT companies. Filter by experience, location and role — apply directly.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch}
            className="flex gap-2 max-w-2xl mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search role, company or skill..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/50 text-sm font-medium focus:outline-none focus:bg-white/20 transition-colors"
              />
            </div>
            <button type="submit"
              className="bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-900 px-7 py-3 rounded-xl font-bold hover:from-yellow-300 hover:to-amber-300 transition-all shadow-lg whitespace-nowrap text-sm">
              Search Jobs
            </button>
          </form>

          {/* Quick filters */}
          <div className="flex flex-wrap gap-2 justify-center mt-5">
            {QUICK_FILTERS.map((f) => (
              <Link key={f.href} href={f.href}
                className="text-xs bg-white/10 text-white/80 border border-white/20 px-3.5 py-1.5 rounded-full hover:bg-white/20 hover:text-white transition-all backdrop-blur-sm">
                {f.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">

        {/* Stats */}
        <StatsSection />

        {/* ── Action cards ── */}
        <div className="grid sm:grid-cols-3 gap-4 mb-14">
          <Link href="/jobs"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 p-5 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <p className="font-bold text-lg text-white">Browse All Jobs</p>
              <p className="text-xs text-indigo-100 mt-0.5">Filter by exp, location & type</p>
              <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
                Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/map"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 hover:-translate-y-0.5 transition-all">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <p className="font-bold text-lg text-white">Job Map</p>
              <p className="text-xs text-emerald-100 mt-0.5">Explore jobs by location</p>
              <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
                View Map <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <button onClick={() => setShowAlert(true)}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 p-5 text-white shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5 transition-all text-left w-full">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <p className="font-bold text-lg text-white">Job Alerts</p>
              <p className="text-xs text-rose-100 mt-0.5">Daily email notifications</p>
              <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
                Set up <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* ── Browse by Category ── */}
        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Browse by Category</h2>
              <p className="text-sm text-slate-500 mt-1">Explore opportunities across every domain</p>
            </div>
            <Link href="/jobs" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              All jobs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FEATURED_ROLES.map((r) => (
              <Link key={r.role} href={r.href}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200 p-5">
                {/* Gradient bar at top */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${r.gradient} rounded-t-2xl`} />
                {/* Badge */}
                {r.badge && (
                  <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${r.gradient} text-white`}>
                    {r.badge}
                  </span>
                )}
                <div className={`w-12 h-12 rounded-xl ${r.bg} flex items-center justify-center mb-3 text-2xl group-hover:scale-110 transition-transform duration-200`}>
                  {r.icon}
                </div>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug">
                  {r.role}
                </p>
                <div className={`mt-2 text-xs font-semibold bg-gradient-to-r ${r.gradient} bg-clip-text text-transparent flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Explore <ArrowRight className="w-3 h-3 text-indigo-500" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Featured Companies ── */}
        <section className="mb-14">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Top Hiring Companies</h2>
              <p className="text-sm text-slate-500 mt-1">Directly sourced from their career pages</p>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {FEATURED_COMPANIES.map((c) => (
              <Link key={c.name} href={`/jobs?search=${encodeURIComponent(c.name)}`}
                className="group bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md p-3 flex flex-col items-center gap-2 transition-all hover:-translate-y-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://logo.clearbit.com/${c.domain}`}
                  alt={c.name}
                  className="w-10 h-10 object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${c.domain}&sz=64`;
                  }}
                />
                <span className="text-xs font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors text-center leading-tight">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="mb-14">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900">How It Works</h2>
            <p className="text-slate-500 text-sm mt-1">Land your next role in 3 simple steps</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                step: "01",
                icon: Search,
                title: "Search & Filter",
                desc: "Search jobs by role, company or skills. Filter by experience, location, job type and industry.",
                gradient: "from-indigo-500 to-blue-600",
                shadow: "shadow-indigo-100",
              },
              {
                step: "02",
                icon: Globe,
                title: "Explore the Map",
                desc: "See jobs pinned on an interactive map. Click a city marker to view all openings there.",
                gradient: "from-emerald-500 to-teal-600",
                shadow: "shadow-emerald-100",
              },
              {
                step: "03",
                icon: Building2,
                title: "Apply Directly",
                desc: "Click Apply and get redirected to the company's official career page to submit your application.",
                gradient: "from-orange-500 to-rose-600",
                shadow: "shadow-orange-100",
              },
            ].map(({ step, icon: Icon, title, desc, gradient, shadow }) => (
              <div key={step}
                className={`relative bg-white rounded-2xl border border-slate-100 p-6 shadow-lg ${shadow} hover:shadow-xl hover:-translate-y-1 transition-all`}>
                <div className="absolute top-4 right-4 text-5xl font-black text-slate-50 select-none leading-none">
                  {step}
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Why trust us banner ── */}
        <section className="mb-14 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4f46e5] relative">
          <div className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            {[
              { icon: Zap, label: "Daily Refresh", desc: "New jobs added every morning automatically" },
              { icon: Shield, label: "Verified Sources", desc: "Jobs sourced directly from company portals" },
              { icon: TrendingUp, label: "Trending Roles", desc: "AI, Cloud & Security roles updated in real-time" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4 px-8 py-7">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">{label}</p>
                  <p className="text-sm text-indigo-200 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {showAlert && <AlertModal onClose={() => setShowAlert(false)} />}
    </div>
  );
}
