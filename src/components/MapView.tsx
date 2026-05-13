"use client";
import { useEffect, useRef, useState } from "react";
import type { Job } from "@/types";

const CITY_COORDS: Record<string, [number, number]> = {
  "Bangalore": [12.9716, 77.5946],
  "Mumbai": [19.0760, 72.8777],
  "Delhi NCR": [28.7041, 77.1025],
  "Hyderabad": [17.3850, 78.4867],
  "Chennai": [13.0827, 80.2707],
  "Pune": [18.5204, 73.8567],
  "Kolkata": [22.5726, 88.3639],
  "Ahmedabad": [23.0225, 72.5714],
  "Kochi": [9.9312, 76.2673],
  "Jaipur": [26.9124, 75.7873],
  "Chandigarh": [30.7333, 76.7794],
  "Noida": [28.5355, 77.3910],
  "Gurugram": [28.4595, 77.0266],
  "Coimbatore": [11.0168, 76.9558],
  "Indore": [22.7196, 75.8577],
  "Nagpur": [21.1458, 79.0882],
  "Singapore": [1.3521, 103.8198],
  "Dubai": [25.2048, 55.2708],
  "London": [51.5074, -0.1278],
  "New York": [40.7128, -74.0060],
  "San Francisco": [37.7749, -122.4194],
  "Berlin": [52.5200, 13.4050],
  "Toronto": [43.6532, -79.3832],
  "Amsterdam": [52.3676, 4.9041],
  "Sydney": [-33.8688, 151.2093],
  "Tokyo": [35.6762, 139.6503],
  "Paris": [48.8566, 2.3522],
  "Austin": [30.2672, -97.7431],
  "Seattle": [47.6062, -122.3321],
};

const CITY_NORMALIZE: Record<string, string> = {
  "Bengaluru": "Bangalore", "Bagaluru": "Bangalore", "Mysuru": "Bangalore",
  "Mysore": "Bangalore", "Mangalore": "Bangalore", "Hubli": "Bangalore",
  "Akurdi": "Pune", "Pimpri": "Pune", "Pimpri-Chinchwad": "Pune",
  "Chinchwad": "Pune", "Talegaon": "Pune",
  "Navi Mumbai": "Mumbai", "Thane": "Mumbai", "Kalyan": "Mumbai",
  "Vasai": "Mumbai", "Panvel": "Mumbai",
  "Savli": "Ahmedabad", "Vadodara": "Ahmedabad", "Surat": "Ahmedabad",
  "Gandhinagar": "Ahmedabad",
  "Secunderabad": "Hyderabad", "Warangal": "Hyderabad",
  "Nirsa": "Kolkata", "Dhanbad": "Kolkata", "Durgapur": "Kolkata",
  "Madurai": "Chennai", "Tiruchirappalli": "Chennai", "Salem": "Chennai",
  "Ludhiana": "Chandigarh", "Amritsar": "Chandigarh",
  "Ghaziabad": "Delhi NCR", "Faridabad": "Delhi NCR", "Noida": "Delhi NCR",
  "Greater Noida": "Delhi NCR", "Gurgaon": "Gurugram",
};

function normalizeCity(city: string): string | null {
  if (!city || city === "Remote" || city === "Unknown") return null;
  if (CITY_COORDS[city]) return city;
  return CITY_NORMALIZE[city] ?? null;
}

export interface CompanyInfo { name: string; domain: string; count: number; }

function groupByCity(jobs: Job[]): Map<string, { coords: [number, number]; jobs: Job[]; companies: CompanyInfo[] }> {
  const raw = new Map<string, { coords: [number, number]; jobs: Job[]; domMap: Map<string, { name: string; count: number }> }>();
  for (const job of jobs) {
    const city = normalizeCity(job.city);
    if (!city) continue;
    const coords = CITY_COORDS[city];
    if (!coords) continue;
    if (!raw.has(city)) raw.set(city, { coords, jobs: [], domMap: new Map() });
    const entry = raw.get(city)!;
    entry.jobs.push(job);
    if (job.logoDomain) {
      const prev = entry.domMap.get(job.logoDomain);
      if (prev) prev.count++;
      else entry.domMap.set(job.logoDomain, { name: job.company, count: 1 });
    }
  }
  const result = new Map<string, { coords: [number, number]; jobs: Job[]; companies: CompanyInfo[] }>();
  raw.forEach(({ coords, jobs, domMap }, city) => {
    const companies = [...domMap.entries()]
      .map(([domain, { name, count }]) => ({ name, domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    result.set(city, { coords, jobs, companies });
  });
  return result;
}

function buildMarkerEl(
  city: string,
  count: number,
  companies: CompanyInfo[],
  jobs: Job[],
  isSelected: boolean,
  onClick: () => void
): HTMLElement {
  const top = companies[0];
  const countLabel = count > 99 ? "99+" : String(count);
  const displayName = (top?.name ?? city).length > 15
    ? (top?.name ?? city).slice(0, 14) + "…"
    : (top?.name ?? city);
  const logoSrc = top?.domain ? `https://logo.clearbit.com/${top.domain}` : "/default-company.svg";
  const fallback = top?.domain ? `https://www.google.com/s2/favicons?domain=${top.domain}&sz=64` : "/default-company.svg";

  const cardBorder = isSelected ? "2px solid #4f46e5" : "1.5px solid rgba(0,0,0,0.1)";
  const cardShadow = isSelected
    ? "0 4px 20px rgba(79,70,229,0.4),0 1px 4px rgba(0,0,0,0.12)"
    : "0 2px 12px rgba(0,0,0,0.22),0 1px 3px rgba(0,0,0,0.1)";

  // Tooltip: other companies in this city
  const otherRows = companies.slice(1, 4).map((c) => {
    const cLogo = c.domain ? `https://logo.clearbit.com/${c.domain}` : "/default-company.svg";
    const cFb = c.domain ? `https://www.google.com/s2/favicons?domain=${c.domain}&sz=16` : "/default-company.svg";
    return `<div style="display:flex;align-items:center;gap:7px;padding:3px 0;">
      <img src="${cLogo}" width="16" height="16"
        style="border-radius:3px;object-fit:contain;background:#f1f5f9;border:1px solid #e2e8f0;flex-shrink:0;"
        onerror="this.onerror=null;this.src='${cFb}'" />
      <span style="flex:1;font-size:11px;color:#334155;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.name}</span>
      <span style="font-size:10px;font-weight:700;color:#6366f1;">${c.count}</span>
    </div>`;
  }).join("");

  // Job list card (shown on click)
  const jobRows = jobs.slice(0, 8).map((j) => {
    const jLogo = j.logoDomain ? `https://logo.clearbit.com/${j.logoDomain}` : "/default-company.svg";
    const jFb = j.logoDomain ? `https://www.google.com/s2/favicons?domain=${j.logoDomain}&sz=32` : "/default-company.svg";
    const title = j.title.length > 40 ? j.title.slice(0, 38) + "…" : j.title;
    const co = j.company.length > 22 ? j.company.slice(0, 20) + "…" : j.company;
    return `<a href="${j.applyUrl}" target="_blank" rel="noopener noreferrer"
      style="display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid #f1f5f9;text-decoration:none;">
      <div style="width:32px;height:32px;border-radius:7px;background:#f8fafc;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">
        <img src="${jLogo}" width="24" height="24" style="object-fit:contain;"
          onerror="this.onerror=null;this.src='${jFb}'" />
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:10px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${co}</div>
        <div style="font-size:12px;color:#0f172a;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
      </div>
      <span style="font-size:10px;font-weight:700;color:white;background:#6366f1;padding:3px 9px;border-radius:20px;flex-shrink:0;white-space:nowrap;">Apply →</span>
    </a>`;
  }).join("");

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "cursor:pointer;transform:translate(-50%,-50%);position:relative;pointer-events:auto;";

  wrapper.innerHTML = `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <!-- Pill card marker -->
      <div data-card style="
        display:flex;align-items:center;gap:8px;
        background:white;
        border:${cardBorder};
        border-radius:14px;
        padding:6px 10px 6px 6px;
        box-shadow:${cardShadow};
        transition:transform 0.15s ease,box-shadow 0.15s ease;
        min-width:130px;max-width:200px;
      ">
        <div style="
          width:34px;height:34px;border-radius:8px;
          background:#f8fafc;border:1px solid #e2e8f0;
          display:flex;align-items:center;justify-content:center;
          overflow:hidden;flex-shrink:0;
        ">
          <img src="${logoSrc}" width="26" height="26" style="object-fit:contain;"
            onerror="this.onerror=null;this.src='${fallback}'" />
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:11.5px;font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;">${displayName}</div>
          <div style="font-size:10px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${city}</div>
        </div>
        <div style="
          background:${isSelected ? "#4f46e5" : "#6366f1"};
          color:white;border-radius:10px;
          font-size:10px;font-weight:700;
          padding:3px 8px;white-space:nowrap;flex-shrink:0;
          font-family:Inter,sans-serif;
        ">${countLabel}</div>
      </div>
      <!-- Hover tooltip -->
      <div data-tooltip style="
        display:none;
        position:absolute;top:calc(100% + 8px);
        left:50%;transform:translateX(-50%);
        background:white;border:1px solid #e2e8f0;
        border-radius:10px;padding:10px 12px;
        min-width:180px;max-width:220px;
        box-shadow:0 8px 24px rgba(0,0,0,0.14);
        z-index:9998;pointer-events:none;
      ">
        <div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid #f1f5f9;">
          ${city} &middot; <span style="color:#6366f1;">${count} job${count !== 1 ? "s" : ""}</span>
        </div>
        ${otherRows || '<div style="font-size:11px;color:#64748b;">Click to explore openings</div>'}
        <div style="font-size:10px;color:#94a3b8;margin-top:6px;text-align:center;">Click to see all openings →</div>
      </div>
      <!-- Job list popup (shown on click) -->
      <div data-jobcard style="
        display:${isSelected ? "block" : "none"};
        position:absolute;top:calc(100% + 10px);
        left:50%;transform:translateX(-50%);
        background:white;border:1px solid #e2e8f0;
        border-radius:16px;padding:14px 16px;
        min-width:290px;max-width:330px;
        max-height:340px;overflow-y:auto;
        box-shadow:0 20px 50px rgba(0,0,0,0.18),0 4px 12px rgba(0,0,0,0.08);
        z-index:9999;pointer-events:auto;
      ">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #6366f1;">
          <span style="font-size:13px;font-weight:700;color:#0f172a;">📍 ${city}</span>
          <span style="font-size:11px;font-weight:600;color:#6366f1;background:#eef2ff;padding:2px 9px;border-radius:20px;">${count} openings</span>
        </div>
        ${jobRows}
        ${count > 8 ? `<div style="font-size:11px;color:#94a3b8;text-align:center;padding-top:8px;">+${count - 8} more — see side panel</div>` : ""}
      </div>
    </div>
  `;

  wrapper.addEventListener("click", onClick);

  const jobCard = wrapper.querySelector("[data-jobcard]") as HTMLElement | null;
  if (jobCard) jobCard.addEventListener("click", (e) => e.stopPropagation());

  const cardEl = wrapper.querySelector("[data-card]") as HTMLElement | null;
  const tooltipEl = wrapper.querySelector("[data-tooltip]") as HTMLElement | null;

  wrapper.addEventListener("mouseenter", () => {
    if (cardEl) {
      cardEl.style.transform = "scale(1.06)";
      cardEl.style.boxShadow = isSelected
        ? "0 6px 28px rgba(79,70,229,0.45),0 2px 8px rgba(0,0,0,0.12)"
        : "0 6px 22px rgba(0,0,0,0.28),0 2px 6px rgba(0,0,0,0.1)";
    }
    if (tooltipEl && !isSelected) tooltipEl.style.display = "block";
  });
  wrapper.addEventListener("mouseleave", () => {
    if (cardEl) {
      cardEl.style.transform = "scale(1)";
      cardEl.style.boxShadow = cardShadow;
    }
    if (tooltipEl) tooltipEl.style.display = "none";
  });

  return wrapper;
}

interface Props {
  jobs: Job[];
  selectedCity: string | null;
  onSelectCity: (city: string, jobs: Job[]) => void;
}

export function MapView({ jobs, selectedCity, onSelectCity }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const onSelectRef = useRef(onSelectCity);
  const [globeReady, setGlobeReady] = useState(false);
  onSelectRef.current = onSelectCity;

  useEffect(() => {
    if (!containerRef.current || globeRef.current) return;
    let mounted = true;

    (async () => {
      const GlobeGL = (await import("globe.gl")).default;
      if (!mounted || !containerRef.current) return;

      const el = containerRef.current;

      const globe = (GlobeGL as any)()(el)
        .width(el.offsetWidth)
        .height(el.offsetHeight)
        // earth-blue-marble.jpg is a confirmed valid texture in three-globe
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .showAtmosphere(true)
        .atmosphereColor("#93c5fd")
        .atmosphereAltitude(0.14)
        .htmlElementsData([])
        .htmlLat("lat")
        .htmlLng("lng")
        .htmlAltitude(0.01)
        .htmlElement((d: any) =>
          buildMarkerEl(d.city, d.count, d.companies, d.jobs, d.isSelected, () => {
            globe.controls().autoRotate = false;
            globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.8 }, 800);
            onSelectRef.current(d.city, d.jobs);
          })
        )
        .ringsData([])
        .ringLat("lat")
        .ringLng("lng")
        .ringColor(() => "#6366f1")
        .ringMaxRadius(4)
        .ringPropagationSpeed(2)
        .ringRepeatPeriod(1000);

      const controls = globe.controls();
      controls.autoRotate = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.zoomSpeed = 1.5;
      controls.minDistance = 110;
      controls.maxDistance = 700;
      if ("zoomToCursor" in controls) (controls as any).zoomToCursor = true;

      globe.pointOfView({ lat: 20, lng: 78, altitude: 2.5 });

      const ro = new ResizeObserver(() => {
        if (containerRef.current) {
          globe.width(containerRef.current.offsetWidth);
          globe.height(containerRef.current.offsetHeight);
        }
      });
      ro.observe(el);

      // Prevent browser page zoom — let the globe's OrbitControls handle wheel events
      const blockBrowserZoom = (e: WheelEvent) => e.preventDefault();
      el.addEventListener("wheel", blockBrowserZoom, { passive: false });

      (globe as any)._ro = ro;
      (globe as any)._el = el;
      (globe as any)._wheelListener = blockBrowserZoom;
      globeRef.current = globe;
      setGlobeReady(true);
    })();

    return () => {
      mounted = false;
      if (globeRef.current) {
        globeRef.current._ro?.disconnect();
        if (globeRef.current._el) {
          globeRef.current._el.removeEventListener("wheel", globeRef.current._wheelListener);
          globeRef.current._el.innerHTML = "";
        }
        globeRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!globeReady || !globeRef.current) return;
    const cityMap = groupByCity(jobs);
    const markers: any[] = [];
    const rings: any[] = [];
    cityMap.forEach(({ coords, jobs: cityJobs, companies }, city) => {
      const isSelected = city === selectedCity;
      markers.push({
        city, lat: coords[0], lng: coords[1],
        count: cityJobs.length, jobs: cityJobs,
        companies, isSelected,
      });
      if (isSelected) rings.push({ lat: coords[0], lng: coords[1] });
    });
    globeRef.current.htmlElementsData(markers);
    globeRef.current.ringsData(rings);
  }, [jobs, selectedCity, globeReady]);

  return (
    <div ref={containerRef} className="w-full h-full" style={{ background: "#0f172a", touchAction: "none" }} />
  );
}
