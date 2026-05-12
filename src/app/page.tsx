"use client";
import Link from "next/link";
import { useState } from "react";
import { Search, MapPin, Briefcase, Bell, ArrowRight, Zap, Globe, Building2 } from "lucide-react";
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
  { icon: "⚙️", role: "Software Engineering", href: "/jobs?industry=Software+Engineering" },
  { icon: "🤖", role: "Data & AI", href: "/jobs?industry=Data+%26+AI" },
  { icon: "☁️", role: "DevOps & Cloud", href: "/jobs?industry=DevOps+%26+Cloud" },
  { icon: "🔐", role: "Cybersecurity", href: "/jobs?industry=Cybersecurity" },
  { icon: "📊", role: "Product Management", href: "/jobs?industry=Product+Management" },
  { icon: "🎨", role: "Design", href: "/jobs?industry=Design" },
  { icon: "💰", role: "Finance & Fintech", href: "/jobs?industry=Finance+%26+Fintech" },
  { icon: "📣", role: "Sales & Marketing", href: "/jobs?industry=Sales+%26+Marketing" },
];

const FEATURED_COMPANIES = [
  { name: "Google", domain: "google.com", type: "MNC" },
  { name: "Microsoft", domain: "microsoft.com", type: "MNC" },
  { name: "Amazon", domain: "amazon.com", type: "MNC" },
  { name: "Razorpay", domain: "razorpay.com", type: "Startup" },
  { name: "CRED", domain: "cred.club", type: "Startup" },
  { name: "Swiggy", domain: "swiggy.com", type: "Startup" },
  { name: "Infosys", domain: "infosys.com", type: "IndianIT" },
  { name: "Wipro", domain: "wipro.com", type: "IndianIT" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) window.location.href = `/jobs?search=${encodeURIComponent(search)}`;
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-white/20 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-white/30">
            <Zap className="w-4 h-4" /> Updated daily — new jobs posted every morning
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-4">
            Find Your Next<br />
            <span className="text-yellow-300">Dream Role</span>
          </h1>
          <p className="text-lg text-primary-100 mb-8 max-w-xl mx-auto">
            Curated job openings from top startups, MNCs and Indian IT companies. Filter by experience, location and role — apply directly from here.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by role, company or skill..."
                className="w-full pl-10 pr-4 py-3.5 rounded-xl text-slate-900 text-sm font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <button type="submit" className="bg-yellow-400 text-slate-900 px-6 py-3.5 rounded-xl font-semibold hover:bg-yellow-300 transition-colors shadow-lg whitespace-nowrap">
              Search
            </button>
          </form>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {QUICK_FILTERS.map((f) => (
              <Link key={f.href} href={f.href}
                className="text-xs bg-white/20 text-white border border-white/30 px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors backdrop-blur-sm">
                {f.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Stats */}
        <StatsSection />

        {/* Action cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <Link href="/jobs" className="group bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-md p-5 transition-all flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Browse All Jobs</p>
              <p className="text-xs text-slate-500">Filter by exp, location & type</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 ml-auto transition-colors" />
          </Link>
          <Link href="/map" className="group bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-md p-5 transition-all flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Job Map</p>
              <p className="text-xs text-slate-500">Explore jobs by location</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 ml-auto transition-colors" />
          </Link>
          <button onClick={() => setShowAlert(true)} className="group bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-md p-5 transition-all flex items-center gap-4 text-left w-full">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 transition-colors">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Job Alerts</p>
              <p className="text-xs text-slate-500">Daily email notifications</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 ml-auto transition-colors" />
          </button>
        </div>

        {/* Browse by category */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FEATURED_ROLES.map((r) => (
              <Link key={r.role} href={r.href}
                className="bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-sm p-4 text-center transition-all group">
                <div className="text-2xl mb-2">{r.icon}</div>
                <p className="text-sm font-medium text-slate-700 group-hover:text-primary-600 transition-colors">{r.role}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured companies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Hiring Companies</h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
            {FEATURED_COMPANIES.map((c) => (
              <Link key={c.name} href={`/jobs?search=${encodeURIComponent(c.name)}`}
                className="bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-sm p-3 flex flex-col items-center gap-2 transition-all group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://logo.clearbit.com/${c.domain}`} alt={c.name}
                  className="w-10 h-10 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/default-company.svg"; }} />
                <span className="text-xs font-medium text-slate-600 group-hover:text-primary-600 transition-colors text-center">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-gradient-to-br from-primary-50 to-slate-50 rounded-2xl p-8 border border-primary-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">How It Works</h2>
          <p className="text-slate-500 text-center mb-8">Find and apply to your next job in 3 simple steps</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "01", icon: Search, title: "Search & Filter", desc: "Search jobs by role, company or skills. Filter by experience (1-10yrs), location, job type and industry." },
              { step: "02", icon: Globe, title: "Explore the Map", desc: "See jobs on an interactive map. Company logos mark exact locations. Click to see job details and apply." },
              { step: "03", icon: Building2, title: "Apply Directly", desc: "Fill in your details once. We save your application and redirect you to the company's page to complete it." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center mx-auto mb-3 font-bold text-lg shadow-md shadow-primary-200">
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-primary-500 mb-1">STEP {step}</p>
                <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {showAlert && <AlertModal onClose={() => setShowAlert(false)} />}
    </div>
  );
}
