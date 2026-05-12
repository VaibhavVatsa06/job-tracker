"use client";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { cn, formatSalary, timeAgo, expLabel, logoUrl, companyTypeColors, jobTypeColors, expColor } from "@/lib/utils";
import type { Job } from "@/types";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  job: Job;
  userEmail?: string;
  isSaved?: boolean;
  onSaveToggle?: (jobId: string, saved: boolean) => void;
}

export function JobCard({ job, userEmail, isSaved = false, onSaveToggle }: Props) {
  const [saved, setSaved] = useState(isSaved);
  const [saving, setSaving] = useState(false);

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    if (!userEmail) { toast.error("Enter your email in the saved jobs page to save jobs"); return; }
    setSaving(true);
    const method = saved ? "DELETE" : "POST";
    const res = await fetch("/api/saved", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, userEmail }),
    });
    if (res.ok) {
      setSaved(!saved);
      toast.success(saved ? "Removed from saved" : "Job saved!");
      onSaveToggle?.(job.id, !saved);
    }
    setSaving(false);
  }

  return (
    <Link href={`/jobs/${job.id}`} className="group block bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <Image
                src={logoUrl(job.logoDomain)}
                alt={job.company}
                width={40}
                height={40}
                className="object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = "/default-company.svg"; }}
                unoptimized
              />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">{job.company}</p>
              <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                {job.title}
              </h3>
            </div>
          </div>
          <button
            onClick={toggleSave}
            disabled={saving}
            className={cn("flex-shrink-0 p-1.5 rounded-lg transition-colors", saved ? "text-primary-600 bg-primary-50" : "text-slate-400 hover:text-primary-600 hover:bg-primary-50")}
            title={saved ? "Remove from saved" : "Save job"}
          >
            {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", companyTypeColors[job.companyType])}>
            {job.companyType}
          </span>
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", jobTypeColors[job.jobType])}>
            {job.jobType}
          </span>
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", expColor(job.minExp))}>
            {expLabel(job.minExp, job.maxExp)} exp
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{job.location}</span>
        </div>

        {job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {job.skills.slice(0, 4).map((s) => (
              <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{s}</span>
            ))}
            {job.skills.length > 4 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">+{job.skills.length - 4}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-800">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> {timeAgo(job.postedAt)}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-primary-600 group-hover:gap-2 transition-all">
            View Job <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
  );
}
