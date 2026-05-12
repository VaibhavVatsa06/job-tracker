"use client";
import { useState } from "react";
import { X, Send, CheckCircle, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import type { Job } from "@/types";

interface Props {
  job: Job;
  onClose: () => void;
}

export function ApplicationModal({ job, onClose }: Props) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [applyUrl, setApplyUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", resumeUrl: "", coverLetter: "" });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, ...form }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setApplyUrl(data.applyUrl);
      setStep("success");
    } else {
      toast.error(data.error || "Failed to submit");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-bold text-slate-900">Apply for {job.title}</h2>
            <p className="text-sm text-slate-500">{job.company}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {step === "form" ? (
          <form onSubmit={submit} className="p-6 space-y-4">
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
              Your details will be saved and you&apos;ll be redirected to {job.company}&apos;s application page to complete the process.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Rahul Sharma" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="rahul@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Resume / LinkedIn URL</label>
              <input type="url" value={form.resumeUrl} onChange={(e) => set("resumeUrl", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://linkedin.com/in/yourprofile" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cover Letter (optional)</label>
              <textarea rows={4} value={form.coverLetter} onChange={(e) => set("coverLetter", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Why are you a great fit for this role?" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Send className="w-4 h-4" />}
              {loading ? "Submitting..." : "Save & Continue to Apply"}
            </button>
          </form>
        ) : (
          <div className="p-6 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">Application Saved!</h3>
              <p className="text-slate-600 mt-1">
                Your details have been saved. Click below to complete your application on {job.company}&apos;s website.
              </p>
            </div>
            <a href={applyUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors">
              <ExternalLink className="w-4 h-4" />
              Apply on {job.company}&apos;s Website
            </a>
            <button onClick={onClose} className="w-full border border-slate-200 text-slate-700 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
