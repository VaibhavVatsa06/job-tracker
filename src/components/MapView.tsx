"use client";
import { useEffect, useRef } from "react";
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

function getCoords(job: Job): [number, number] | null {
  if (job.lat && job.lng) return [job.lat, job.lng];
  return CITY_COORDS[job.city] ?? null;
}

function groupByCity(jobs: Job[]): Map<string, { coords: [number, number]; jobs: Job[] }> {
  const map = new Map<string, { coords: [number, number]; jobs: Job[] }>();
  for (const job of jobs) {
    const coords = getCoords(job);
    if (!coords) continue;
    const key = job.city || "Unknown";
    if (!map.has(key)) map.set(key, { coords, jobs: [] });
    map.get(key)!.jobs.push(job);
  }
  return map;
}

// Pick the most common company logo domain in a city cluster
function getTopDomain(jobs: Job[]): string {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    if (job.logoDomain) counts.set(job.logoDomain, (counts.get(job.logoDomain) || 0) + 1);
  }
  if (!counts.size) return "";
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function buildMarkerEl(
  city: string,
  count: number,
  topDomain: string,
  isSelected: boolean,
  onClick: () => void
): HTMLElement {
  const size = isSelected ? 46 : 38;
  const imgSize = size - 10;
  const borderColor = isSelected ? "#fbbf24" : "rgba(255,255,255,0.92)";
  const badgeBg = isSelected ? "#fbbf24" : "#6366f1";
  const badgeColor = isSelected ? "#1e1b4b" : "white";
  const glowShadow = isSelected
    ? "0 0 0 3px rgba(251,191,36,0.35), 0 6px 24px rgba(0,0,0,0.7)"
    : "0 4px 16px rgba(0,0,0,0.6)";
  const labelColor = isSelected ? "#fbbf24" : "rgba(255,255,255,0.9)";
  const labelBorder = isSelected ? "rgba(251,191,36,0.4)" : "rgba(129,140,248,0.35)";
  const countLabel = count > 99 ? "99+" : String(count);

  const logoSrc = topDomain
    ? `https://logo.clearbit.com/${topDomain}`
    : `https://www.google.com/s2/favicons?domain=${topDomain}&sz=32`;
  const fallbackSrc = topDomain
    ? `https://www.google.com/s2/favicons?domain=${topDomain}&sz=32`
    : "/default-company.svg";

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "cursor:pointer;transform:translate(-50%,-50%);position:relative;";
  wrapper.innerHTML = `
    <div style="
      position:relative;
      display:flex;
      flex-direction:column;
      align-items:center;
    ">
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        border:2.5px solid ${borderColor};
        background:rgba(255,255,255,0.97);
        box-shadow:${glowShadow};
        display:flex;align-items:center;justify-content:center;
        overflow:hidden;
        transition:transform 0.15s;
      ">
        <img
          src="${logoSrc}"
          width="${imgSize}" height="${imgSize}"
          style="object-fit:contain;border-radius:50%;"
          onerror="this.onerror=null;this.src='${fallbackSrc}'"
        />
      </div>
      <div style="
        position:absolute;
        top:-5px;right:-5px;
        background:${badgeBg};
        color:${badgeColor};
        border-radius:50%;
        min-width:18px;height:18px;
        padding:0 3px;
        font-size:9px;font-weight:800;
        display:flex;align-items:center;justify-content:center;
        border:1.5px solid white;
        font-family:Inter,sans-serif;
        line-height:1;
      ">${countLabel}</div>
      <div style="
        margin-top:4px;
        background:rgba(8,12,30,0.88);
        color:${labelColor};
        font-size:9px;font-weight:700;
        padding:2px 7px;border-radius:5px;
        white-space:nowrap;
        font-family:Inter,sans-serif;
        border:1px solid ${labelBorder};
        letter-spacing:0.01em;
      ">${city}</div>
    </div>
  `;

  wrapper.addEventListener("click", onClick);

  // Hover scale
  wrapper.addEventListener("mouseenter", () => {
    (wrapper.firstElementChild?.firstElementChild as HTMLElement | null)?.style &&
      ((wrapper.firstElementChild!.firstElementChild as HTMLElement).style.transform = "scale(1.15)");
  });
  wrapper.addEventListener("mouseleave", () => {
    (wrapper.firstElementChild?.firstElementChild as HTMLElement | null)?.style &&
      ((wrapper.firstElementChild!.firstElementChild as HTMLElement).style.transform = "scale(1)");
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
  onSelectRef.current = onSelectCity;

  // Init globe once
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
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
        .showAtmosphere(true)
        .atmosphereColor("#818cf8")
        .atmosphereAltitude(0.22)
        // HTML marker layer (company logos)
        .htmlElementsData([])
        .htmlLat("lat")
        .htmlLng("lng")
        .htmlAltitude(0.01)
        .htmlElement((d: any) =>
          buildMarkerEl(d.city, d.count, d.topDomain, d.isSelected, () => {
            globe.controls().autoRotate = false;
            globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.8 }, 900);
            onSelectRef.current(d.city, d.jobs);
          })
        )
        // Ring animation for selected city
        .ringsData([])
        .ringLat("lat")
        .ringLng("lng")
        .ringColor(() => "#fbbf24")
        .ringMaxRadius(4)
        .ringPropagationSpeed(2)
        .ringRepeatPeriod(900);

      const controls = globe.controls();
      // No auto-rotation — user controls the globe manually
      controls.autoRotate = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;

      // Start looking at India
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

  // Update markers and rings when jobs or selected city changes
  useEffect(() => {
    if (!globeRef.current) return;

    const cityMap = groupByCity(jobs);
    const markers: any[] = [];
    const rings: any[] = [];

    cityMap.forEach(({ coords, jobs: cityJobs }, city) => {
      const isSelected = city === selectedCity;
      markers.push({
        city,
        lat: coords[0],
        lng: coords[1],
        count: cityJobs.length,
        jobs: cityJobs,
        topDomain: getTopDomain(cityJobs),
        isSelected,
      });
      if (isSelected) rings.push({ lat: coords[0], lng: coords[1] });
    });

    globeRef.current.htmlElementsData(markers);
    globeRef.current.ringsData(rings);
  }, [jobs, selectedCity]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "#00000f" }}
    />
  );
}
