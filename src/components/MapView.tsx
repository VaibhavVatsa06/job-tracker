"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
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

function markerColor(jobs: Job[]): { from: string; to: string } {
  const types = jobs.map((j) => j.companyType);
  const startups = types.filter((t) => t === "Startup").length;
  const mncs = types.filter((t) => t === "MNC" || t === "IndianIT").length;
  if (startups > mncs) return { from: "#f97316", to: "#ea580c" };
  if (mncs > startups) return { from: "#6366f1", to: "#4f46e5" };
  return { from: "#8b5cf6", to: "#7c3aed" };
}

interface Props {
  jobs: Job[];
  selectedCity: string | null;
  onSelectCity: (city: string, jobs: Job[]) => void;
}

export function MapView({ jobs, selectedCity, onSelectCity }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<import("leaflet").LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let mounted = true;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css" as string);
      if (!mounted || !containerRef.current) return;

      // Inject pulse animation
      if (!document.getElementById("map-pulse-style")) {
        const s = document.createElement("style");
        s.id = "map-pulse-style";
        s.textContent = `
          @keyframes mapPulse {
            0% { transform: scale(1); opacity: 0.7; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          .map-pulse { animation: mapPulse 1.8s ease-out infinite; }
        `;
        document.head.appendChild(s);
      }

      const map = L.map(containerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        scrollWheelZoom: true,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // CartoDB light tile — cleaner, more stylish
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      const group = L.layerGroup().addTo(map);
      mapRef.current = map;
      markersRef.current = group;
      setMapReady(true);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !markersRef.current) return;
    let mounted = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!mounted || !markersRef.current) return;
      markersRef.current.clearLayers();

      const cityMap = groupByCity(jobs);

      cityMap.forEach(({ coords, jobs: cityJobs }, city) => {
        const count = cityJobs.length;
        const { from, to } = markerColor(cityJobs);
        const isSelected = city === selectedCity;
        const size = count >= 20 ? 52 : count >= 10 ? 46 : count >= 5 ? 40 : 34;
        const fontSize = count >= 10 ? 14 : 12;
        const pulse = count >= 5;

        const icon = L.divIcon({
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
              <div style="position:relative;">
                ${pulse ? `<div class="map-pulse" style="position:absolute;inset:-4px;border-radius:50%;background:${from};pointer-events:none;"></div>` : ""}
                <div style="
                  width:${size}px;height:${size}px;border-radius:50%;
                  background:linear-gradient(135deg,${from},${to});
                  border:${isSelected ? "3px solid #fff" : "2px solid rgba(255,255,255,0.9)"};
                  box-shadow:${isSelected ? `0 0 0 3px ${from},0 6px 20px ${from}70` : `0 4px 14px ${from}60`};
                  display:flex;align-items:center;justify-content:center;
                  color:white;font-weight:700;font-size:${fontSize}px;
                  transition:all 0.2s;
                ">${count}</div>
              </div>
              <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid ${to};margin-top:-1px;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.15));"></div>
              <div style="
                background:rgba(0,0,0,0.75);color:white;
                font-size:10px;font-weight:600;
                padding:2px 6px;border-radius:4px;
                margin-top:2px;white-space:nowrap;
                backdrop-filter:blur(4px);
              ">${city}</div>
            </div>`,
          className: "",
          iconSize: [size + 16, size + 32],
          iconAnchor: [(size + 16) / 2, size + 32],
        });

        const marker = L.marker(coords, { icon });
        marker.addTo(markersRef.current!);
        marker.on("click", () => onSelectCity(city, cityJobs));
      });
    })();
    return () => { mounted = false; };
  }, [jobs, mapReady, selectedCity, onSelectCity]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
