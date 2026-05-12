"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { Job } from "@/types";
import { formatSalary, expLabel, logoUrl, jobTypeColors } from "@/lib/utils";
import { MapPin, X, ExternalLink, Briefcase } from "lucide-react";

interface Props {
  jobs: Job[];
}

export function MapView({ jobs }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<import("leaflet").LayerGroup | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Boot map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let mounted = true;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css" as string);
      if (!mounted || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const group = L.layerGroup().addTo(map);
      mapRef.current = map;
      markersRef.current = group;
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Re-draw markers when jobs change
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    let mounted = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!mounted || !markersRef.current) return;

      markersRef.current.clearLayers();

      jobs
        .filter((j) => j.lat != null && j.lng != null)
        .forEach((job) => {
          const color = job.jobType === "Remote" ? "#7c3aed" : job.companyType === "Startup" ? "#ea580c" : "#4f46e5";
          const initial = job.company[0]?.toUpperCase() ?? "?";

          const icon = L.divIcon({
            html: `<div style="
                width:44px;height:44px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
                background:white;border:2.5px solid ${color};
                box-shadow:0 3px 10px rgba(0,0,0,0.2);
                display:flex;align-items:center;justify-content:center;cursor:pointer;">
              <img src="https://logo.clearbit.com/${job.logoDomain}"
                   onerror="this.style.display='none';this.nextSibling.style.display='flex'"
                   style="width:26px;height:26px;object-fit:contain;border-radius:50%;transform:rotate(45deg);"/>
              <div style="display:none;transform:rotate(45deg);width:26px;height:26px;
                          background:${color}22;border-radius:50%;align-items:center;justify-content:center;
                          font-size:12px;font-weight:700;color:${color};">
                ${initial}
              </div>
            </div>`,
            className: "",
            iconSize: [44, 44],
            iconAnchor: [22, 44],
            popupAnchor: [0, -48],
          });

          const marker = L.marker([job.lat!, job.lng!], { icon });
          marker.addTo(markersRef.current!);
          marker.on("click", () => setSelectedJob(job));
          marker.bindTooltip(`<strong>${job.title}</strong><br>${job.company}`, {
            direction: "top",
            offset: [0, -44],
          });
        });
    })();

    return () => { mounted = false; };
  }, [jobs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-xl" />

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-xl border border-slate-200 shadow-sm p-3 z-[1000] text-xs space-y-1.5">
        <p className="font-semibold text-slate-700 mb-2">Legend</p>
        {[
          { color: "#4f46e5", label: "MNC / Indian IT" },
          { color: "#ea580c", label: "Startup" },
          { color: "#7c3aed", label: "Remote" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-slate-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Selected-job panel */}
      {selectedJob && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-[1000] animate-slide-up">
          <button onClick={() => setSelectedJob(null)} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>

          <div className="flex items-start gap-3 mb-3 pr-6">
            <div className="w-10 h-10 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl(selectedJob.logoDomain)} alt={selectedJob.company}
                className="w-8 h-8 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = "/default-company.svg"; }} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{selectedJob.company}</p>
              <h4 className="font-semibold text-slate-900 text-sm leading-snug">{selectedJob.title}</h4>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${jobTypeColors[selectedJob.jobType]}`}>
              {selectedJob.jobType}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              {expLabel(selectedJob.minExp, selectedJob.maxExp)} exp
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
            <MapPin className="w-3 h-3 flex-shrink-0" /> {selectedJob.location}
          </div>
          <p className="text-xs font-semibold text-slate-700 mb-3">
            {formatSalary(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.currency)}
          </p>

          <div className="flex gap-2">
            <a href={`/jobs/${selectedJob.id}`}
              className="flex-1 flex items-center justify-center gap-1 text-xs font-medium bg-primary-600 text-white rounded-lg py-2 hover:bg-primary-700 transition-colors">
              <Briefcase className="w-3 h-3" /> View Details
            </a>
            <a href={selectedJob.applyUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors">
              <ExternalLink className="w-3 h-3" /> Apply
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
