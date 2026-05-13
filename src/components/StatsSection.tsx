"use client";
import { useEffect, useState } from "react";
import { Briefcase, Building2, MapPin, Wifi } from "lucide-react";
import type { JobStats } from "@/types";

const CARDS = [
  {
    key: "totalJobs" as const,
    label: "Active Jobs",
    icon: Briefcase,
    gradient: "from-indigo-500 to-blue-600",
    glow: "shadow-indigo-200",
    bg: "bg-indigo-50",
    ring: "ring-indigo-100",
  },
  {
    key: "totalCompanies" as const,
    label: "Companies",
    icon: Building2,
    gradient: "from-orange-400 to-rose-500",
    glow: "shadow-orange-200",
    bg: "bg-orange-50",
    ring: "ring-orange-100",
  },
  {
    key: "totalCities" as const,
    label: "Cities",
    icon: MapPin,
    gradient: "from-emerald-400 to-teal-600",
    glow: "shadow-emerald-200",
    bg: "bg-emerald-50",
    ring: "ring-emerald-100",
  },
  {
    key: "remoteJobs" as const,
    label: "Remote Jobs",
    icon: Wifi,
    gradient: "from-violet-500 to-purple-700",
    glow: "shadow-violet-200",
    bg: "bg-violet-50",
    ring: "ring-violet-100",
  },
];

function StatCard({
  icon: Icon,
  value,
  label,
  gradient,
  glow,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  gradient: string;
  glow: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1400;
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
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-0.5 shadow-lg ${glow}`}>
      <div className="relative bg-white rounded-[14px] px-5 py-5 h-full">
        {/* Decorative circle */}
        <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${gradient} opacity-10`} />
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-md`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {count.toLocaleString()}<span className="text-xl text-slate-400">+</span>
        </p>
        <p className="text-sm font-medium text-slate-500 mt-0.5">{label}</p>
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
      {CARDS.map(({ key, label, icon, gradient, glow }) => (
        <StatCard
          key={key}
          icon={icon}
          value={stats[key]}
          label={label}
          gradient={gradient}
          glow={glow}
        />
      ))}
    </div>
  );
}
