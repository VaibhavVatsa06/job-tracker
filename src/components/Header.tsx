"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Map, BookmarkCheck, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/jobs", label: "Browse Jobs", icon: Briefcase },
  { href: "/map", label: "Job Map", icon: Map },
  { href: "/saved", label: "Saved Jobs", icon: BookmarkCheck },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-600">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span>JobTracker</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  path.startsWith(href)
                    ? "bg-primary-50 text-primary-600"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          <Link href="/jobs" className="hidden md:block bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            Find Jobs
          </Link>

          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
                  path.startsWith(href) ? "bg-primary-50 text-primary-600" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
