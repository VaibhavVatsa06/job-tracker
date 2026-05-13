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
  "Gurgaon": [28.4595, 77.0266],
  "Gurugram": [28.4595, 77.0266],
  "Coimbatore": [11.0168, 76.9558],
  "Indore": [22.7196, 75.8577],
  "Nagpur": [21.1458, 79.0882],
  "Bhubaneswar": [20.2961, 85.8245],
  "Visakhapatnam": [17.6868, 83.2185],
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
  "Bengaluru": "Bangalore", "Bagaluru": "Bangalore", "Dharwad": "Bangalore",
  "Mysuru": "Bangalore", "Mysore": "Bangalore", "Mangalore": "Bangalore",
  "Hubli": "Bangalore",
  "Akurdi": "Pune", "Pimpri": "Pune", "Pimpri-Chinchwad": "Pune",
  "Pimp": "Pune", "Chinchwad": "Pune", "Talegaon": "Pune",
  "Navi Mumbai": "Mumbai", "Thane": "Mumbai", "Kalyan": "Mumbai",
  "Vasai": "Mumbai", "Panvel": "Mumbai",
  "Savli": "Ahmedabad", "Vadodara": "Ahmedabad", "Surat": "Ahmedabad",
  "Gandhinagar": "Ahmedabad", "Rajkot": "Ahmedabad",
  "Secunderabad": "Hyderabad", "Warangal": "Hyderabad",
  "Nirsa": "Kolkata", "Dhanbad": "Kolkata", "Durgapur": "Kolkata",
  "Asansol": "Kolkata",
  "Madurai": "Chennai", "Thoothukudi": "Chennai", "Tiruchirappalli": "Chennai",
  "Tuticorin": "Chennai", "Salem": "Chennai", "Vellore": "Chennai",
  "Ludhiana": "Chandigarh", "Amritsar": "Chandigarh", "Jalandhar": "Chandigarh",
  "Ghaziabad": "Delhi NCR", "Faridabad": "Delhi NCR", "Meerut": "Delhi NCR",
  "Greater Noida": "Noida",
  "Kasa": "Mumbai", "wad": "Pune", "am": "Hyderabad", "ravaram": "Hyderabad",
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
  const size = isSelected ? 58 : 46;
  const imgSize = size - 16;
  const borderColor = isSelected ? "#fbbf24" : "rgba(34,211,238,0.9)";
  const outerGlow = isSelected
    ? "0 0 0 3px rgba(251,191,36,0.2),0 0 20px rgba(251,191,36,0.55),0 6px 28px rgba(0,0,0,0.9)"
    : "0 0 0 1px rgba(255,255,255,0.04),0 0 14px rgba(34,211,238,0.35),0 6px 24px rgba(0,0,0,0.8)";
  const badgeBg = isSelected ? "#fbbf24" : "#22d3ee";
  const badgeText = isSelected ? "#1a1a2e" : "#061018";
  const labelColor = isSelected ? "#fbbf24" : "#e2e8f0";
  const labelBorder = isSelected ? "rgba(251,191,36,0.3)" : "rgba(34,211,238,0.18)";
  const countLabel = count > 99 ? "99+" : String(count);

  const logoSrc = top?.domain ? `https://logo.clearbit.com/${top.domain}` : "/default-company.svg";
  const fallback = top?.domain ? `https://www.google.com/s2/favicons?domain=${top.domain}&sz=32` : "/default-company.svg";

  // Hover tooltip — top 3 companies summary
  const compRows = companies.slice(0, 3).map((c) => {
    const cLogo = c.domain ? `https://logo.clearbit.com/${c.domain}` : "/default-company.svg";
    const cFb = c.domain ? `https://www.google.com/s2/favicons?domain=${c.domain}&sz=16` : "/default-company.svg";
    return `<div style="display:flex;align-items:center;gap:8px;padding:3px 0;">
      <img src="${cLogo}" width="16" height="16" style="border-radius:3px;object-fit:contain;flex-shrink:0;"
        onerror="this.onerror=null;this.src='${cFb}'" />
      <span style="flex:1;font-size:11px;color:#cbd5e1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.name}</span>
      <span style="font-size:10px;color:#22d3ee;font-weight:700;flex-shrink:0;">${c.count}</span>
    </div>`;
  }).join("");

  // Selected card — full job list with apply links
  const jobRows = jobs.slice(0, 8).map((j) => {
    const jLogo = j.logoDomain ? `https://logo.clearbit.com/${j.logoDomain}` : "/default-company.svg";
    const jFb = j.logoDomain ? `https://www.google.com/s2/favicons?domain=${j.logoDomain}&sz=16` : "/default-company.svg";
    const title = j.title.length > 42 ? j.title.slice(0, 40) + "…" : j.title;
    const company = j.company.length > 22 ? j.company.slice(0, 20) + "…" : j.company;
    return `<a href="${j.applyUrl}" target="_blank" rel="noopener noreferrer"
      style="display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-decoration:none;">
      <img src="${jLogo}" width="22" height="22" style="border-radius:5px;object-fit:contain;flex-shrink:0;background:rgba(255,255,255,0.08);"
        onerror="this.onerror=null;this.src='${jFb}'" />
      <div style="flex:1;min-width:0;">
        <div style="font-size:10px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${company}</div>
        <div style="font-size:11.5px;color:#f1f5f9;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
      </div>
      <span style="font-size:12px;color:#22d3ee;flex-shrink:0;font-weight:700;">→</span>
    </a>`;
  }).join("");

  const moreLabel = count > 8
    ? `<div style="font-size:10px;color:#475569;text-align:center;padding-top:6px;border-top:1px solid rgba(255,255,255,0.05);">+${count - 8} more · see side panel</div>`
    : "";

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "cursor:pointer;transform:translate(-50%,-50%);position:relative;pointer-events:auto;";

  wrapper.innerHTML = `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <!-- Circle -->
      <div data-circle style="
        width:${size}px;height:${size}px;border-radius:50%;
        border:2px solid ${borderColor};
        background:linear-gradient(135deg,rgba(8,14,30,0.97),rgba(4,8,20,0.97));
        box-shadow:${outerGlow};
        display:flex;align-items:center;justify-content:center;overflow:hidden;
        transition:transform 0.18s ease,box-shadow 0.18s ease;
      ">
        <img src="${logoSrc}" width="${imgSize}" height="${imgSize}"
          style="object-fit:contain;border-radius:50%;"
          onerror="this.onerror=null;this.src='${fallback}'" />
      </div>
      <!-- Count badge -->
      <div style="
        position:absolute;top:-5px;right:-5px;
        background:${badgeBg};color:${badgeText};
        border-radius:50%;min-width:18px;height:18px;padding:0 3px;
        font-size:9px;font-weight:800;
        display:flex;align-items:center;justify-content:center;
        border:1.5px solid rgba(4,8,20,0.9);
        font-family:Inter,sans-serif;line-height:1;
      ">${countLabel}</div>
      <!-- City label -->
      <div style="
        margin-top:5px;background:rgba(4,8,20,0.92);color:${labelColor};
        font-size:10px;font-weight:700;padding:3px 9px;border-radius:6px;
        white-space:nowrap;font-family:Inter,sans-serif;
        border:1px solid ${labelBorder};letter-spacing:0.03em;
        box-shadow:0 2px 8px rgba(0,0,0,0.7);
      ">${city} <span style="opacity:0.55;font-weight:500">(${countLabel})</span></div>
      <!-- Hover tooltip -->
      <div data-tooltip style="
        display:none;position:absolute;
        bottom:calc(100% + 10px);left:50%;transform:translateX(-50%);
        background:rgba(4,8,20,0.98);
        border:1px solid rgba(34,211,238,0.22);
        border-radius:12px;padding:12px 14px;
        min-width:200px;max-width:240px;
        box-shadow:0 16px 48px rgba(0,0,0,0.95);
        z-index:9998;pointer-events:none;
      ">
        <div style="font-size:13px;font-weight:700;color:#f1f5f9;margin-bottom:8px;padding-bottom:7px;border-bottom:1px solid rgba(34,211,238,0.1);">
          ${city}<span style="font-size:11px;color:#22d3ee;font-weight:500;"> · ${count} job${count !== 1 ? "s" : ""}</span>
        </div>
        ${compRows}
        <div style="font-size:10px;color:#4b5563;margin-top:8px;text-align:center;border-top:1px solid rgba(255,255,255,0.04);padding-top:6px;">Click to see all openings →</div>
      </div>
      <!-- Selected job list card -->
      <div data-jobcard style="
        display:${isSelected ? "block" : "none"};
        position:absolute;
        top:calc(100% + 12px);
        left:50%;transform:translateX(-50%);
        background:rgba(4,8,20,0.98);
        border:1px solid rgba(251,191,36,0.3);
        border-radius:14px;padding:12px 14px;
        min-width:270px;max-width:310px;
        max-height:300px;overflow-y:auto;
        z-index:9999;pointer-events:auto;
        box-shadow:0 24px 64px rgba(0,0,0,0.97),0 0 0 1px rgba(251,191,36,0.08);
      ">
        <div style="font-size:12px;font-weight:700;color:#fbbf24;margin-bottom:9px;padding-bottom:7px;border-bottom:1px solid rgba(251,191,36,0.15);display:flex;align-items:center;gap:6px;">
          <span>📍</span> ${city} · ${count} opening${count !== 1 ? "s" : ""}
        </div>
        ${jobRows}
        ${moreLabel}
      </div>
    </div>
  `;

  wrapper.addEventListener("click", onClick);

  // Stop clicks inside the job card from bubbling up to the marker's onClick
  const jobCard = wrapper.querySelector("[data-jobcard]") as HTMLElement | null;
  if (jobCard) {
    jobCard.addEventListener("click", (e) => e.stopPropagation());
  }

  const circleEl = wrapper.querySelector("[data-circle]") as HTMLElement | null;
  const tooltipEl = wrapper.querySelector("[data-tooltip]") as HTMLElement | null;

  wrapper.addEventListener("mouseenter", () => {
    if (circleEl) {
      circleEl.style.transform = "scale(1.2)";
      circleEl.style.boxShadow = isSelected
        ? "0 0 0 3px rgba(251,191,36,0.3),0 0 28px rgba(251,191,36,0.6),0 8px 32px rgba(0,0,0,0.9)"
        : "0 0 0 1px rgba(255,255,255,0.06),0 0 24px rgba(34,211,238,0.55),0 8px 32px rgba(0,0,0,0.9)";
    }
    if (tooltipEl && !isSelected) tooltipEl.style.display = "block";
  });
  wrapper.addEventListener("mouseleave", () => {
    if (circleEl) {
      circleEl.style.transform = "scale(1)";
      circleEl.style.boxShadow = outerGlow;
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
        // Clean political-style base — solid color ocean, land painted via polygons
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-day.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .showAtmosphere(true)
        .atmosphereColor("#4a9eff")
        .atmosphereAltitude(0.18)
        // Country border polygons (loaded async below)
        .polygonsData([])
        .polygonCapColor(() => "rgba(10,24,55,0.0)")
        .polygonSideColor(() => "rgba(0,0,0,0)")
        .polygonStrokeColor(() => "rgba(34,211,238,0.55)")
        .polygonAltitude(0.004)
        // Markers
        .htmlElementsData([])
        .htmlLat("lat")
        .htmlLng("lng")
        .htmlAltitude(0.015)
        .htmlElement((d: any) =>
          buildMarkerEl(d.city, d.count, d.companies, d.jobs, d.isSelected, () => {
            globe.controls().autoRotate = false;
            globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.8 }, 900);
            onSelectRef.current(d.city, d.jobs);
          })
        )
        // Ring pulse on selected city
        .ringsData([])
        .ringLat("lat")
        .ringLng("lng")
        .ringColor(() => "#22d3ee")
        .ringMaxRadius(5)
        .ringPropagationSpeed(2)
        .ringRepeatPeriod(900);

      // Controls: no auto-rotate, zoom-to-cursor, smooth damping
      const controls = globe.controls();
      controls.autoRotate = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.zoomSpeed = 1.5;
      controls.minDistance = 110;
      controls.maxDistance = 700;
      // zoom toward cursor if supported by the three.js version in use
      if ("zoomToCursor" in controls) (controls as any).zoomToCursor = true;

      globe.pointOfView({ lat: 20, lng: 78, altitude: 2.5 });

      // Responsive resize
      const ro = new ResizeObserver(() => {
        if (containerRef.current) {
          globe.width(containerRef.current.offsetWidth);
          globe.height(containerRef.current.offsetHeight);
        }
      });
      ro.observe(el);

      (globe as any)._ro = ro;
      (globe as any)._el = el;
      globeRef.current = globe;
      setGlobeReady(true);

      // Fetch country border GeoJSON — gives political map feel
      // Silently skipped if network fails; globe still works without it
      fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
        .then((r) => r.json())
        .then((geo) => {
          if (mounted && globeRef.current) {
            globeRef.current.polygonsData(geo.features);
          }
        })
        .catch(() => {
          // Try a smaller fallback
          fetch("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
            .then((r) => r.json())
            .then((geo) => {
              if (mounted && globeRef.current) {
                globeRef.current.polygonsData(geo.features);
              }
            })
            .catch(() => {}); // borders are decorative — failure is fine
        });
    })();

    return () => {
      mounted = false;
      if (globeRef.current) {
        globeRef.current._ro?.disconnect();
        if (globeRef.current._el) globeRef.current._el.innerHTML = "";
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
    <div ref={containerRef} className="w-full h-full" style={{ background: "#060914" }} />
  );
}
