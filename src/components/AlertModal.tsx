"use client";
import { useState } from "react";
import { X, Bell, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Props { onClose: () => void; }

export function AlertModal({ onClose }: Props) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", keywords: "", location: "", frequency: "daily" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setStep("success");
    else toast.error(data.error || "Failed to create alert");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-600" />
            <h2 className="font-bold text-slate-900">Job Alerts</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {step === "form" ? (
          <form onSubmit={submit} className="p-6 space-y-4">
            <p className="text-sm text-slate-600">Get notified when new jobs matching your criteria are posted.</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="you@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Keywords *</label>
              <input required value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. React Developer, Data Scientist" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Bangalore, Remote" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly summary</option>
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Bell className="w-4 h-4" />}
              {loading ? "Setting up..." : "Create Alert"}
            </button>
          </form>
        ) : (
          <div className="p-6 text-center space-y-4">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-slate-900">Alert Created!</h3>
            <p className="text-sm text-slate-600">You&apos;ll receive {form.frequency} job alerts for &ldquo;{form.keywords}&rdquo; at {form.email}.</p>
            <button onClick={onClose} className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
