import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTampere } from "@/lib/TampereContext";
import { MobileBusinessLegend } from "./MobileBusinessLegend";
import { PulseToggle } from "./PulseToggle";
import { fetchMapItems, fetchTrafficData, fetchTampereCenter } from "@/lib/api";
import { MapItem } from "@/lib/types";
import { LocationMetrics } from "./LocationMetrics";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`%c🗺️ MOBILE MAP DEBUG: ${message}`, 'background: #f0f0f0; color: #0066cc; font-weight: bold; padding: 2px 5px; border-radius: 3px;', data || '');
};

export const MobileBusinessMap: React.FC = () => {
  const {
    hotspots,
    events,
    selectedHotspot,
    selectedEvent,
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
  const [isAnyCardExpanded, setIsAnyCardExpanded] = useState(false);

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

        // Add traffic layer
        map.current?.addSource("traffic", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        map.current?.addLayer({
          id: "traffic-lines",
          type: "line",
          source: "traffic",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-width": 6,
            "line-color": [
              "match",
              ["get", "status"],
              "available",
              "#4caf50",
              "moderate",
              "#ffc107",
              "congested",
              "#ea384c",
              "#000000",
            ],
            "line-opacity": 0.7,
          },
        });
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

  // Update markers for hotspots and events
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Add hotspot markers
    hotspots.forEach((hotspot) => {
      const markerElement = document.createElement("div");
      const trafficClass = hotspot.trafficLevel || "medium";
      markerElement.className = `hotspot-card ${trafficClass} ${selectedHotspot?.id === hotspot.id ? 'selected' : ''}`;
      markerElement.textContent = hotspot.label;

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: "center",
      })
        .setLngLat(hotspot.coordinates)
        .addTo(map.current!);

      markersRef.current[`hotspot-${hotspot.id}`] = marker;
    });

    // Add event markers
    events.forEach((event) => {
      const markerElement = document.createElement("div");
      markerElement.innerHTML = `
        <div class="event-marker ${selectedEvent?.id === event.id ? 'selected' : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-clock">
            <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.5"></path>
            <path d="M16 2v4"></path>
            <path d="M8 2v4"></path>
            <path d="M3 10h18"></path>
            <circle cx="18" cy="18" r="4"></circle>
            <path d="M18 16.5v1.5h1.5"></path>
          </svg>
        </div>
      `;

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: "center",
      })
        .setLngLat(event.coordinates)
        .addTo(map.current!);

      markersRef.current[`event-${event.id}`] = marker;
    });

    // Add additional map items
    mapItems.forEach((item: MapItem) => {
      if (item.type !== 'event' && item.type !== 'hotspot') {
        let markerElement = document.createElement("div");
        markerElement.className = `map-icon-container ${getMapItemColor(item.type)}`;
        markerElement.innerHTML = getMapItemIcon(item.type);

        const marker = new maplibregl.Marker({
          element: markerElement,
          anchor: "center",
        })
          .setLngLat(item.coordinates)
          .addTo(map.current!);

        markersRef.current[`${item.type}-${item.id}`] = marker;
      }
    });
  }, [hotspots, events, selectedHotspot, selectedEvent, mapItems, mapLoaded]);

  // Helper function to get map item icon
  const getMapItemIcon = (type: string) => {
    switch (type) {
      case "bus":
        return `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus">
            <path d="M19 17h2l.64-2.54c.24-.959.24-1.962 0-2.92l-1.07-4.27A3 3 0 0 0 17.66 5H4a2 2 0 0 0-2 2v10h2"></path>
            <path d="M14 17H9"></path>
            <circle cx="6.5" cy="17.5" r="2.5"></circle>
            <circle cx="16.5" cy="17.5" r="2.5"></circle>
          </svg>
        `;
      case "tram":
        return `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-train">
            <rect x="4" y="3" width="16" height="16" rx="2"></rect>
            <path d="M4 11h16"></path>
            <path d="M12 3v8"></path>
            <path d="m8 19-2 3"></path>
            <path d="m18 22-2-3"></path>
            <path d="M8 15h0"></path>
            <path d="M16 15h0"></path>
          </svg>
        `;
      case "parking":
        return `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-parking">
            <rect width="18" height="18" x="3" y="3" rx="2"></rect>
            <path d="M9 17V7h4a3 3 0 0 1 0 6H9"></path>
          </svg>
        `;
      case "available":
        return `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-dot">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="1"></circle>
          </svg>
        `;
      default:
        return "";
    }
  };

  // Helper function to get map item color class
  const getMapItemColor = (type: string) => {
    switch (type) {
      case "bus": return "text-blue-600";
      case "tram": return "text-purple-700";
      case "parking": return "text-blue-800";
      case "available": return "text-green-600";
      default: return "";
    }
  };

  const showDetails = selectedEvent !== null || selectedHotspot !== null;

  return (
    <div className="relative w-full h-full flex flex-col">
      <div
        ref={mapContainer}
        className={`w-full transition-all duration-300 ${
          showDetails
            ? isAnyCardExpanded
              ? "h-1/3"
              : "h-1/2"
            : "h-full"
        } rounded-lg overflow-hidden border border-gray-200 relative`}
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

        {showDetails && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <MobileBusinessLegend />
          </div>
        )}
      </div>

      {showDetails && (
        <div
          className={`w-full transition-all duration-300 ${
            isAnyCardExpanded ? "h-2/3" : "h-1/2"
          } relative`}
        >
          <LocationMetrics onAnyCardExpanded={setIsAnyCardExpanded} />
        </div>
      )}
    </div>
  );
}; 