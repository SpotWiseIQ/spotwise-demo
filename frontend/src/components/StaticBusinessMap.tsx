import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTampere } from "@/lib/TampereContext";
import { PulseToggle } from "./PulseToggle";
import { fetchMapItems, fetchTrafficData, fetchTampereCenter } from "@/lib/api";
import { MapItem } from "@/lib/types";
import { LocationMetrics } from "./LocationMetrics";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`%c🗺️ STATIC MAP DEBUG: ${message}`, 'background: #f0f0f0; color: #0066cc; font-weight: bold; padding: 2px 5px; border-radius: 3px;', data || '');
};

export const StaticBusinessMap: React.FC = () => {
  const {
    pulse,
    setPulse,
  } = useTampere();

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapItems, setMapItems] = useState<MapItem[]>([]);
  const [tampereCenter, setTampereCenter] = useState<[number, number]>([23.761, 61.4978]); // Default center

  // Initialize map
  useEffect(() => {
    debugLog("Map initialization effect triggered");
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: "https://tiles.openfreemap.org/styles/positron",
        center: tampereCenter,
        zoom: 12,
      });

      map.current.on("load", () => {
        setMapLoaded(true);
        map.current?.addControl(new maplibregl.NavigationControl(), "top-right");
      });

      map.current.on("error", (e) => {
        console.error("Map error:", e);
        setMapError("Failed to load the map. Please try again later.");
      });
    } catch (error) {
      console.error("Map initialization error:", error);
      setMapError("Failed to initialize the map. Please try again later.");
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [tampereCenter]);

  // Update markers for static business locations
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Add static business markers
    mapItems.forEach((item: MapItem) => {
      if (item.type === 'business') {
        let markerElement = document.createElement("div");
        markerElement.className = `map-icon-container text-orange-600`;
        markerElement.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path>
            <path d="M2 7h20"></path>
            <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"></path>
          </svg>
        `;

        const marker = new maplibregl.Marker({
          element: markerElement,
          anchor: "center",
        })
          .setLngLat(item.coordinates)
          .addTo(map.current!);

        markersRef.current[`business-${item.id}`] = marker;
      }
    });
  }, [mapItems, mapLoaded]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg overflow-hidden border border-gray-200 relative"
      >
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <div className="text-red-500 text-center p-4">
              <p className="font-bold">Error</p>
              <p>{mapError}</p>
            </div>
          </div>
        )}

        <div className="absolute top-4 left-4 z-10">
          <PulseToggle value={pulse} onChange={setPulse} />
        </div>
      </div>
    </div>
  );
}; 