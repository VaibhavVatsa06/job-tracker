"use client";
import { useEffect, useState } from "react";
import { Briefcase, Building2, MapPin, Wifi } from "lucide-react";
import type { JobStats } from "@/types";

function StatCard({ icon: Icon, value, label, color }: { icon: React.ElementType; value: number; label: string; color: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const step = value / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, value);
      setCount(Math.floor(current));
      if (current >= value) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{count.toLocaleString()}+</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export function StatsSection() {
  const [stats, setStats] = useState<JobStats | null>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
      <StatCard icon={Briefcase} value={stats.totalJobs} label="Active Jobs" color="bg-primary-50 text-primary-600" />
      <StatCard icon={Building2} value={stats.totalCompanies} label="Companies" color="bg-orange-50 text-orange-600" />
      <StatCard icon={MapPin} value={stats.totalCities} label="Cities" color="bg-emerald-50 text-emerald-600" />
      <StatCard icon={Wifi} value={stats.remoteJobs} label="Remote Jobs" color="bg-purple-50 text-purple-600" />
    </div>
  );
}
