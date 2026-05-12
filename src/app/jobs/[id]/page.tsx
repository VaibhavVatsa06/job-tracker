"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, Bookmark, BookmarkCheck, ArrowLeft, ExternalLink, Briefcase, DollarSign, Building2, Users, Share2, Check } from "lucide-react";
import { ApplicationModal } from "@/components/ApplicationModal";
import { JobCard } from "@/components/JobCard";
import { cn, formatSalary, timeAgo, expLabel, logoUrl, companyTypeColors, jobTypeColors, expColor } from "@/lib/utils";
import type { Job } from "@/types";
import toast from "react-hot-toast";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job & { applicationCount?: number } | null>(null);
  const [similar, setSimilar] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveEmail, setSaveEmail] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((data) => { setJob(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!job) return;
    fetch(`/api/jobs?industry=${encodeURIComponent(job.industry)}&limit=4`)
      .then((r) => r.json())
      .then((data) => setSimilar((data.jobs as Job[]).filter((j) => j.id !== id).slice(0, 3)));
  }, [job, id]);

  async function toggleSave() {
    if (!saved && !saveEmail) { setShowSaveInput(true); return; }
    const method = saved ? "DELETE" : "POST";
    const res = await fetch("/api/saved", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: id, userEmail: saveEmail }),
    });
    if (res.ok) {
      setSaved(!saved);
      setShowSaveInput(false);
      toast.success(saved ? "Removed from saved" : "Job saved!");
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-6" />
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="h-12 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-4/5" />
        </div>
      </div>
    );
  }

  if (!job) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <p className="text-slate-600 text-lg">Job not found.</p>
      <button onClick={() => router.push("/jobs")} className="mt-4 text-primary-600 hover:underline">Back to jobs</button>
    </div>
  );

  const sections = job.description.split("\n\n");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-50 to-slate-50 px-8 py-8 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl(job.logoDomain)}
                alt={job.company}
                width={48} height={48}
                className="object-contain w-12 h-12"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (job.logoDomain && !img.src.includes("google.com")) {
                    img.src = `https://www.google.com/s2/favicons?domain=${job.logoDomain}&sz=128`;
                  } else {
                    img.src = "/default-company.svg";
                  }
                }}
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" />{job.company}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{job.location}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{timeAgo(job.postedAt)}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={copyLink}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:border-primary-200 hover:text-primary-600 transition-colors"
                title="Copy link">
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Share2 className="w-5 h-5" />}
              </button>
              <button onClick={toggleSave}
                className={cn("p-2 rounded-xl border transition-colors", saved ? "bg-primary-50 border-primary-200 text-primary-600" : "border-slate-200 text-slate-500 hover:border-primary-200 hover:text-primary-600")}>
                {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              </button>
              <button onClick={() => setShowApply(true)}
                className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-sm shadow-primary-200">
                <Briefcase className="w-4 h-4" /> Apply Now
              </button>
            </div>
          </div>

          {/* Inline save email input */}
          {showSaveInput && (
            <div className="mt-4 flex gap-2 items-center bg-white border border-primary-200 rounded-xl px-4 py-3">
              <input
                type="email"
                placeholder="Enter your email to save this job"
                value={saveEmail}
                onChange={(e) => setSaveEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && toggleSave()}
                className="flex-1 text-sm focus:outline-none"
                autoFocus
              />
              <button onClick={toggleSave} className="text-sm font-medium text-primary-600 hover:text-primary-700 px-2">Save</button>
              <button onClick={() => setShowSaveInput(false)} className="text-sm text-slate-400 hover:text-slate-600 px-1">✕</button>
            </div>
          )}
        </div>

        {/* Metadata chips */}
        <div className="px-8 py-4 flex flex-wrap gap-2 border-b border-slate-100">
          <span className={cn("px-3 py-1 rounded-full text-sm font-medium", companyTypeColors[job.companyType])}>{job.companyType}</span>
          <span className={cn("px-3 py-1 rounded-full text-sm font-medium", jobTypeColors[job.jobType])}>{job.jobType}</span>
          <span className={cn("px-3 py-1 rounded-full text-sm font-medium", expColor(job.minExp))}>
            {expLabel(job.minExp, job.maxExp)} experience
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600">{job.industry}</span>
        </div>

        {/* Stats row */}
        <div className="px-8 py-6 grid sm:grid-cols-3 gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Salary</p>
              <p className="text-sm font-semibold text-slate-900">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Experience</p>
              <p className="text-sm font-semibold text-slate-900">{expLabel(job.minExp, job.maxExp)}</p>
            </div>
          </div>
          {job.applicationCount !== undefined && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Applicants</p>
                <p className="text-sm font-semibold text-slate-900">{job.applicationCount} applied</p>
              </div>
            </div>
          )}
        </div>

        {/* Skills */}
        {job.skills.length > 0 && (
          <div className="px-8 py-5 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700 mb-3">Required Skills</p>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((s) => (
                <span key={s} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium border border-primary-100">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="px-8 py-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Job Description</h2>
          <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-3">
            {sections.map((section, i) => {
              if (!section.trim()) return null;
              if (section.startsWith("**") && section.endsWith("**")) {
                return <h3 key={i} className="font-bold text-slate-800 mt-4 mb-1 text-base">{section.replace(/\*\*/g, "")}</h3>;
              }
              if (section.includes("\n- ")) {
                const [heading, ...items] = section.split("\n- ");
                return (
                  <div key={i}>
                    {heading.trim() && <p className="font-semibold text-slate-800 mb-1">{heading.replace(/\*\*/g, "")}</p>}
                    <ul className="list-disc list-inside space-y-1 text-slate-600 ml-1">
                      {items.map((item, j) => <li key={j}>{item.trim()}</li>)}
                    </ul>
                  </div>
                );
              }
              return <p key={i} className="text-slate-600">{section}</p>;
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900">Interested in this role?</p>
            <p className="text-sm text-slate-500">Your details are saved once &mdash; then you&apos;re redirected to complete the application.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white transition-colors">
              <ExternalLink className="w-4 h-4" /> Company Site
            </a>
            <button onClick={() => setShowApply(true)}
              className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-700 transition-colors">
              <Briefcase className="w-4 h-4" /> Apply Now
            </button>
          </div>
        </div>
      </div>

      {/* Similar Jobs */}
      {similar.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Similar Jobs</h2>
            <Link href={`/jobs?industry=${encodeURIComponent(job.industry)}`} className="text-sm text-primary-600 hover:underline">
              View all {job.industry} jobs →
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {similar.map((j) => <JobCard key={j.id} job={j} />)}
          </div>
        </div>
      )}

      {showApply && <ApplicationModal job={job} onClose={() => setShowApply(false)} />}
    </div>
  );
}
