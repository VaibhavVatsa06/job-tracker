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

function cityColor(jobs: Job[]): string {
  const types = jobs.map((j) => j.companyType);
  const startups = types.filter((t) => t === "Startup").length;
  const mncs = types.filter((t) => t === "MNC" || t === "IndianIT").length;
  if (startups > mncs) return "#f97316";
  if (mncs > startups) return "#818cf8";
  return "#a78bfa";
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
        .pointsData([])
        .pointLat("lat")
        .pointLng("lng")
        .pointColor("color")
        .pointRadius("radius")
        .pointAltitude("altitude")
        .pointResolution(16)
        .pointLabel("label")
        .onPointClick((point: any) => {
          globe.controls().autoRotate = false;
          globe.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.8 }, 900);
          onSelectRef.current(point.city, point.jobs);
        })
        .ringsData([])
        .ringLat("lat")
        .ringLng("lng")
        .ringColor(() => "#fbbf24")
        .ringMaxRadius(4)
        .ringPropagationSpeed(2)
        .ringRepeatPeriod(900);

      const controls = globe.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;

      // Start camera looking at India
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

  // Update points and rings whenever jobs or selectedCity changes
  useEffect(() => {
    if (!globeRef.current) return;

    const cityMap = groupByCity(jobs);
    const points: any[] = [];
    const rings: any[] = [];

    cityMap.forEach(({ coords, jobs: cityJobs }, city) => {
      const isSelected = city === selectedCity;
      const count = cityJobs.length;
      const baseRadius = Math.min(Math.sqrt(count) * 0.38 + 0.22, 1.4);

      points.push({
        city,
        lat: coords[0],
        lng: coords[1],
        count,
        jobs: cityJobs,
        color: isSelected ? "#fbbf24" : cityColor(cityJobs),
        radius: isSelected ? baseRadius * 1.7 : baseRadius,
        altitude: isSelected ? 0.08 : 0.02,
        label: `
          <div style="
            background:rgba(8,12,30,0.93);
            color:white;
            padding:8px 14px;
            border-radius:10px;
            font-size:13px;
            font-weight:600;
            border:1px solid rgba(129,140,248,0.5);
            box-shadow:0 6px 24px rgba(0,0,0,0.7);
            white-space:nowrap;
            font-family:Inter,sans-serif;
            pointer-events:none;
          ">
            📍 ${city}
            <div style="color:#a5b4fc;font-weight:400;font-size:11px;margin-top:3px">
              ${count} opening${count !== 1 ? "s" : ""}
            </div>
          </div>
        `,
      });

      if (isSelected) {
        rings.push({ lat: coords[0], lng: coords[1] });
      }
    });

    globeRef.current.pointsData(points);
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
