import Link from "next/link";
import { Briefcase, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <Briefcase className="w-5 h-5 text-primary-500" />
              JobTracker
            </div>
            <p className="text-sm leading-relaxed">
              Curated job openings across India and remote. Updated daily with opportunities from startups, MNCs and more.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link></li>
              <li><Link href="/map" className="hover:text-white transition-colors">Job Map</Link></li>
              <li><Link href="/saved" className="hover:text-white transition-colors">Saved Jobs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Categories</h4>
            <ul className="space-y-2 text-sm">
              {["Software Engineering", "Data & AI", "DevOps & Cloud", "Product Management", "Design"].map((c) => (
                <li key={c}>
                  <Link href={`/jobs?industry=${encodeURIComponent(c)}`} className="hover:text-white transition-colors">{c}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
          <p>© {new Date().getFullYear()} JobTracker. Jobs updated daily.</p>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
            <Github className="w-4 h-4" /> Source
          </a>
        </div>
      </div>
    </footer>
  );
}
