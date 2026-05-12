"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkCheck, Loader2, Search, Mail } from "lucide-react";
import { JobCard } from "@/components/JobCard";
import type { Job } from "@/types";

export default function SavedJobsPage() {
  const [email, setEmail] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("savedEmail");
    if (saved) { setEmail(saved); loadJobs(saved); }
  }, []);

  async function loadJobs(e: string) {
    setLoading(true);
    const res = await fetch(`/api/saved?email=${encodeURIComponent(e)}`);
    const data = await res.json();
    setJobs(data.jobs || []);
    setLoading(false);
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const trimmed = inputEmail.trim();
    if (!trimmed) return;
    setEmail(trimmed);
    localStorage.setItem("savedEmail", trimmed);
    loadJobs(trimmed);
  }

  function handleUnsave(jobId: string) {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <BookmarkCheck className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Saved Jobs</h1>
          <p className="text-sm text-slate-500">Jobs you&apos;ve bookmarked for later</p>
        </div>
      </div>

      {!email ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md mx-auto">
          <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="font-bold text-slate-900 mb-2">Enter your email</h2>
          <p className="text-sm text-slate-500 mb-6">Your saved jobs are linked to your email address. No account needed.</p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email" required value={inputEmail} onChange={(e) => setInputEmail(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
              View
            </button>
          </form>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-slate-600">
              Showing saved jobs for <span className="font-semibold text-primary-600">{email}</span>
            </p>
            <button onClick={() => { setEmail(""); setJobs([]); localStorage.removeItem("savedEmail"); }}
              className="text-xs text-slate-500 hover:text-red-500 transition-colors">
              Switch email
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No saved jobs yet</p>
              <p className="text-sm text-slate-500 mt-1">Bookmark jobs from the listings page to find them here.</p>
              <Link href="/jobs" className="mt-4 inline-block bg-primary-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} userEmail={email} isSaved={true} onSaveToggle={handleUnsave} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
