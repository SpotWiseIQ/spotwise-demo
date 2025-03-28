import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTampere } from "@/lib/TampereContext";
import { TAMPERE_CENTER, mockMapItems } from "@/lib/mockData";
import { TimelineSlider } from "./TimelineSlider";
import { MapLegend } from "./MapLegend";
import { PulseToggle } from "./PulseToggle";

export const TampereMap: React.FC = () => {
  const {
    hotspots,
    events,
    selectedHotspot,
    selectedEvent,
    pulse,
    timelineRange,
    setTimelineRange,
  } = useTampere();
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/positron/style.json',
        center: TAMPERE_CENTER,
        zoom: 14,
      });

      map.current.on("load", () => {
        setMapLoaded(true);
        console.log("Map loaded successfully");
        
        map.current?.addControl(
          new maplibregl.NavigationControl(),
          "top-right"
        );

        map.current?.addSource("traffic", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: { status: "available" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [23.748, 61.4988],
                    [23.760, 61.4988],
                    [23.772, 61.4988],
                  ],
                },
              },
              {
                type: "Feature",
                properties: { status: "moderate" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [23.748, 61.4970],
                    [23.760, 61.4970],
                    [23.772, 61.4970],
                  ],
                },
              },
              {
                type: "Feature",
                properties: { status: "congested" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [23.748, 61.4950],
                    [23.760, 61.4950],
                    [23.772, 61.4950],
                  ],
                },
              },
              {
                type: "Feature",
                properties: { status: "congested" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [23.760, 61.4930],
                    [23.760, 61.4950],
                    [23.760, 61.4970],
                    [23.760, 61.4990],
                  ],
                },
              },
              {
                type: "Feature",
                properties: { status: "available" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [23.748, 61.4930],
                    [23.748, 61.4950],
                    [23.748, 61.4970],
                    [23.748, 61.4990],
                  ],
                },
              },
              {
                type: "Feature",
                properties: { status: "moderate" },
                geometry: {
                  type: "LineString",
                  coordinates: [
                    [23.772, 61.4930],
                    [23.772, 61.4950],
                    [23.772, 61.4970],
                    [23.772, 61.4990],
                  ],
                },
              },
            ],
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
              "available", "#4caf50",
              "moderate", "#ffc107",
              "congested", "#ea384c",
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
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    hotspots.forEach(hotspot => {
      const markerElement = document.createElement("div");
      const dangerClass = hotspot.dangerLevel || "medium";
      const pulseClass = pulse ? "animate-pulse-effect" : "";
      
      markerElement.className = `hotspot-marker ${dangerClass} ${pulseClass}`.trim();
      
      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: 'center'
      })
        .setLngLat(hotspot.coordinates)
        .addTo(map.current!);

      markersRef.current[`hotspot-${hotspot.id}`] = marker;
    });

    events.forEach(event => {
      const markerElement = document.createElement("div");
      const pulseClass = pulse ? "animate-pulse-effect" : "";
      
      markerElement.innerHTML = `
        <div class="event-marker ${pulseClass}">
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
        anchor: 'center'
      })
        .setLngLat(event.coordinates)
        .addTo(map.current!);

      markersRef.current[`event-${event.id}`] = marker;
    });

    if (selectedHotspot || selectedEvent) {
      mockMapItems.forEach(item => {
        let markerElement = document.createElement("div");
        let iconHtml = '';
        
        switch (item.type) {
          case "bus":
            iconHtml = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus">
                <path d="M8 6v6"></path>
                <path d="M16 6v6"></path>
                <path d="M2 12h20"></path>
                <path d="M18 18h2a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"></path>
                <path d="M8 18h8"></path>
                <circle cx="7" cy="20" r="2"></circle>
                <circle cx="17" cy="20" r="2"></circle>
              </svg>
            `;
            markerElement.className = "text-blue-500";
            break;
          case "tram":
            iconHtml = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-help-circle">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <path d="M12 17h.01"></path>
              </svg>
            `;
            markerElement.className = "text-purple-800";
            break;
          case "business":
            iconHtml = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect>
                <path d="M9 22v-4h6v4"></path>
                <path d="M8 6h.01"></path>
                <path d="M16 6h.01"></path>
                <path d="M12 6h.01"></path>
                <path d="M12 10h.01"></path>
                <path d="M12 14h.01"></path>
                <path d="M16 10h.01"></path>
                <path d="M16 14h.01"></path>
                <path d="M8 10h.01"></path>
                <path d="M8 14h.01"></path>
              </svg>
            `;
            markerElement.className = "text-gray-800";
            break;
          case "parking":
            iconHtml = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-parking">
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="M9 9h4a2 2 0 0 1 0 4h-4"></path>
                <path d="M9 13v4"></path>
                <path d="M9 7v2"></path>
              </svg>
            `;
            markerElement.className = "text-blue-500";
            break;
          case "available":
            iconHtml = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
            `;
            markerElement.className = "text-green-500";
            break;
          default:
            break;
        }
        
        markerElement.innerHTML = iconHtml;

        const marker = new maplibregl.Marker({
          element: markerElement,
          anchor: 'center'
        })
          .setLngLat(item.coordinates)
          .addTo(map.current!);

        markersRef.current[`${item.type}-${item.id}`] = marker;
      });
    }
  }, [hotspots, events, mapLoaded, pulse, selectedHotspot, selectedEvent]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (selectedHotspot) {
      map.current.flyTo({
        center: selectedHotspot.coordinates,
        zoom: 15,
        essential: true,
      });
    } else if (selectedEvent) {
      map.current.flyTo({
        center: selectedEvent.coordinates,
        zoom: 15,
        essential: true,
      });
    }
  }, [selectedHotspot, selectedEvent, mapLoaded]);

  const showDetails = selectedEvent !== null || selectedHotspot !== null;

  return (
    <div className="relative w-full h-full">
      {mapError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-medium text-red-600 mb-2">Map Error</h3>
            <p className="text-gray-700">{mapError}</p>
            <button 
              className="mt-4 px-4 py-2 bg-tampere-red text-white rounded hover:bg-red-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      ) : (
        <>
          <div ref={mapContainer} className="absolute inset-0" />
          
          <div className="absolute top-4 right-16 z-10">
            <PulseToggle value={pulse} onChange={value => useTampere().setPulse(value)} />
          </div>
          
          {showDetails && <MapLegend />}
          
          {showDetails && pulse && (
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/10 rounded-lg" />
          )}
          
          {showDetails && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-3/4">
              <TimelineSlider 
                value={timelineRange} 
                onChange={setTimelineRange} 
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
