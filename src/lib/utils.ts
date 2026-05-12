import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import type { CompanyType, JobType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(min: number | null, max: number | null, currency: string): string {
  if (!min && !max) return "Not disclosed";
  const fmt = (n: number) => {
    if (currency === "INR") {
      const lpa = n / 100000;
      return `₹${lpa % 1 === 0 ? lpa : lpa.toFixed(1)}L`;
    }
    return `${currency === "USD" ? "$" : "€"}${(n / 1000).toFixed(0)}K`;
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)} PA`;
  if (min) return `From ${fmt(min)} PA`;
  return `Up to ${fmt(max!)} PA`;
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function expLabel(min: number, max: number): string {
  if (min === max) return `${min}yr`;
  if (max >= 10) return `${min}+ yrs`;
  return `${min}–${max} yrs`;
}

export function logoUrl(domain: string | null): string {
  if (!domain) return "/default-company.svg";
  return `https://logo.clearbit.com/${domain}`;
}

export const companyTypeColors: Record<CompanyType, string> = {
  MNC: "bg-blue-100 text-blue-700",
  Startup: "bg-orange-100 text-orange-700",
  IndianIT: "bg-indigo-100 text-indigo-700",
  MidSize: "bg-gray-100 text-gray-700",
  Government: "bg-green-100 text-green-700",
};

export const jobTypeColors: Record<JobType, string> = {
  "Full-time": "bg-emerald-100 text-emerald-700",
  "Part-time": "bg-yellow-100 text-yellow-700",
  Remote: "bg-purple-100 text-purple-700",
  Hybrid: "bg-cyan-100 text-cyan-700",
};

export const expColor = (yrs: number): string => {
  if (yrs <= 2) return "bg-green-100 text-green-700";
  if (yrs <= 5) return "bg-blue-100 text-blue-700";
  if (yrs <= 8) return "bg-purple-100 text-purple-700";
  return "bg-red-100 text-red-700";
};

export const INDUSTRIES = [
  "Software Engineering",
  "Data & AI",
  "Product Management",
  "Design",
  "DevOps & Cloud",
  "Cybersecurity",
  "Finance & Fintech",
  "Sales & Marketing",
  "Operations",
  "HR & Talent",
];

export const CITIES = [
  "Bangalore",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Ahmedabad",
  "Kochi",
  "Jaipur",
  "Remote",
  "Singapore",
  "Dubai",
  "London",
];
