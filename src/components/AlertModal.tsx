"use client";
import { useState } from "react";
import { X, Bell, CheckCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props { onClose: () => void; }

const JOB_ROLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Engineer",
  "Full Stack Developer",
  "React Developer",
  "Node.js Developer",
  "Python Developer",
  "Java Developer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Data Analyst",
  "AI Engineer",
  "Product Manager",
  "UI/UX Designer",
  "Android Developer",
  "iOS Developer",
  "QA Engineer",
  "Cybersecurity Engineer",
  "Golang Developer",
  "Site Reliability Engineer",
];

const LOCATION_GROUPS = [
  {
    group: "Remote",
    options: ["Remote", "Remote India", "Remote Worldwide"],
  },
  {
    group: "India — Metro",
    options: ["Bangalore", "Mumbai", "Delhi NCR", "Hyderabad", "Chennai", "Pune"],
  },
  {
    group: "India — Other",
    options: ["Kolkata", "Ahmedabad", "Kochi", "Jaipur", "Chandigarh", "Coimbatore"],
  },
  {
    group: "International",
    options: ["Singapore", "Dubai", "London", "San Francisco", "New York"],
  },
];

export function AlertModal({ onClose }: Props) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", keywords: "", location: "", frequency: "daily" });
  const [keywordsOpen, setKeywordsOpen] = useState(false);
  const [customKeyword, setCustomKeyword] = useState("");

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

  function selectRole(role: string) {
    setForm({ ...form, keywords: role });
    setKeywordsOpen(false);
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

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input required type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="you@email.com" />
            </div>

            {/* Job Role dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Role *</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setKeywordsOpen(!keywordsOpen)}
                  className={cn(
                    "w-full border rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between transition-colors",
                    keywordsOpen ? "border-primary-500 ring-2 ring-primary-500" : "border-slate-200"
                  )}
                >
                  <span className={form.keywords ? "text-slate-900" : "text-slate-400"}>
                    {form.keywords || "Select a job role…"}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", keywordsOpen && "rotate-180")} />
                </button>

                {keywordsOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="max-h-52 overflow-y-auto">
                      {JOB_ROLES.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => selectRole(role)}
                          className={cn(
                            "w-full text-left px-4 py-2 text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors",
                            form.keywords === role && "bg-primary-50 text-primary-700 font-medium"
                          )}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                    {/* Custom keyword input */}
                    <div className="border-t border-slate-100 p-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customKeyword}
                          onChange={(e) => setCustomKeyword(e.target.value)}
                          placeholder="Or type a custom role…"
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && customKeyword.trim()) {
                              e.preventDefault();
                              selectRole(customKeyword.trim());
                              setCustomKeyword("");
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => { if (customKeyword.trim()) { selectRole(customKeyword.trim()); setCustomKeyword(""); } }}
                          className="px-3 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700"
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Hidden required input to trigger validation */}
              <input
                required
                type="text"
                value={form.keywords}
                onChange={() => {}}
                className="sr-only"
                tabIndex={-1}
              />
            </div>

            {/* Location dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Location</label>
              <select
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">Any location</option>
                {LOCATION_GROUPS.map(({ group, options }) => (
                  <optgroup key={group} label={group}>
                    {options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
              <div className="flex gap-2">
                {[{ label: "Daily", value: "daily" }, { label: "Weekly", value: "weekly" }].map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, frequency: value })}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
                      form.frequency === value
                        ? "bg-primary-600 text-white border-primary-600"
                        : "text-slate-600 border-slate-200 hover:border-primary-300"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
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
            <p className="text-sm text-slate-600">
              You&apos;ll receive {form.frequency} job alerts for &ldquo;{form.keywords}&rdquo;
              {form.location ? ` in ${form.location}` : ""} at {form.email}.
            </p>
            <button onClick={onClose} className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
