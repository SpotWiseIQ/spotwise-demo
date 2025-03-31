import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTampere } from "@/lib/TampereContext";
import { TimelineSlider } from "./TimelineSlider";
import { MapLegend } from "./MapLegend";
import { PulseToggle } from "./PulseToggle";
import { fetchMapItems, fetchTrafficData, fetchTampereCenter } from "@/lib/api";
import { MapItem } from "@/lib/types";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`🗺️ MAP DEBUG: ${message}`, data || '');
};

export const TampereMap: React.FC = () => {
  const {
    hotspots,
    events,
    selectedHotspot,
    selectedEvent,
    pulse,
    timelineRange,
    setTimelineRange,
    loading,
    setPulse,
  } = useTampere();
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapItems, setMapItems] = useState<MapItem[]>([]);
  const [tampereCenter, setTampereCenter] = useState<[number, number]>([23.7610, 61.4978]); // Default center

  // Debug component mount
  useEffect(() => {
    debugLog("TampereMap component mounted");
    return () => {
      debugLog("TampereMap component unmounted");
    };
  }, []);

  // Fetch Tampere center coordinates
  useEffect(() => {
    debugLog("Fetching Tampere center coordinates");
    const getTampereCenter = async () => {
      try {
        debugLog("API call: fetchTampereCenter");
        const center = await fetchTampereCenter();
        debugLog("Tampere center fetched successfully", center);
        setTampereCenter(center);
      } catch (error) {
        console.error("Failed to fetch Tampere center:", error);
        debugLog("Error fetching Tampere center, using default", tampereCenter);
        // Keep using the default center
      }
    };

    getTampereCenter();
  }, []);

  // Fetch map items
  useEffect(() => {
    debugLog("Fetching map items");
    const getMapItems = async () => {
      try {
        debugLog("API call: fetchMapItems");
        const items = await fetchMapItems();
        debugLog("Map items fetched successfully", items);
        setMapItems(items);
      } catch (error) {
        console.error("Failed to fetch map items:", error);
        debugLog("Error fetching map items", error);
      }
    };

    getMapItems();
  }, []);

  useEffect(() => {
    debugLog("Map initialization effect triggered");
    debugLog(`Map container exists: ${!!mapContainer.current}`);
    debugLog(`Map instance exists: ${!!map.current}`);
    
    if (!mapContainer.current || map.current) return;

    debugLog("Initializing map with center", tampereCenter);
    debugLog("Map container dimensions", {
      width: mapContainer.current.offsetWidth,
      height: mapContainer.current.offsetHeight
    });

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: tampereCenter,
        zoom: 12,
      });

      debugLog("Map instance created successfully");

      map.current.on("load", () => {
        debugLog("Map LOAD event fired");
        setMapLoaded(true);
        console.log("Map loaded successfully");
        
        map.current?.addControl(
          new maplibregl.NavigationControl(),
          "top-right"
        );
        debugLog("Navigation controls added");

        map.current?.addSource("traffic", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });
        debugLog("Traffic source added");

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
        debugLog("Traffic layer added");
      });

      map.current.on("error", (e) => {
        console.error("Map error:", e);
        debugLog("Map ERROR event fired", e);
        setMapError("Failed to load the map. Please try again later.");
      });

      // Additional map events for debugging
      map.current.on("style.load", () => {
        debugLog("Map STYLE.LOAD event fired");
      });

      map.current.on("render", () => {
        if (!mapLoaded) {
          debugLog("Map rendering...");
        }
      });

      map.current.on("idle", () => {
        debugLog("Map IDLE event fired - map is fully rendered");
      });
    } catch (error) {
      console.error("Map initialization error:", error);
      debugLog("CRITICAL ERROR during map initialization", error);
      setMapError("Failed to initialize the map. Please try again later.");
    }

    return () => {
      debugLog("Cleaning up map instance");
      map.current?.remove();
      map.current = null;
    };
  }, [tampereCenter]);

  // Update traffic data based on pulse state
  useEffect(() => {
    if (!map.current || !mapLoaded) {
      debugLog("Map not ready for traffic data update");
      return;
    }

    if (pulse) {
      debugLog("Pulse enabled - fetching traffic data");
      fetchTrafficData()
        .then(trafficData => {
          debugLog("Traffic data loaded successfully");
          if (map.current && map.current.getSource('traffic')) {
            (map.current.getSource('traffic') as maplibregl.GeoJSONSource).setData(trafficData);
          }
        })
        .catch(error => {
          console.error("Failed to fetch traffic data:", error);
          debugLog("Error fetching traffic data");
        });
    } else {
      // Clear traffic lines when pulse is off
      if (map.current && map.current.getSource('traffic')) {
        debugLog("Clearing traffic data - pulse off");
        (map.current.getSource('traffic') as maplibregl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [],
        });
      }
    }
  }, [pulse, mapLoaded]);

  // Update map markers and traffic data for selected items
  useEffect(() => {
    if (!map.current || !mapLoaded) {
      debugLog(`Skipping markers update - Map ready: ${!!map.current}, Map loaded: ${mapLoaded}`);
      return;
    }

    debugLog("Updating map markers");
    debugLog(`Hotspots: ${hotspots.length}, Events: ${events.length}`);
    debugLog(`Selected hotspot: ${selectedHotspot ? selectedHotspot.id : 'none'}`);
    debugLog(`Selected event: ${selectedEvent ? selectedEvent.id : 'none'}`);
    debugLog(`Map items count: ${mapItems.length}`);

    // Remove all existing markers
    const markerCount = Object.keys(markersRef.current).length;
    debugLog(`Removing ${markerCount} existing markers`);
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Always show hotspots
    debugLog(`Adding ${hotspots.length} hotspot markers`);
    hotspots.forEach(hotspot => {
      const markerElement = document.createElement("div");
      const dangerClass = hotspot.dangerLevel || "medium";
      const pulseClass = "";  // Remove pulse effect from markers
      const isSelected = selectedHotspot && selectedHotspot.id === hotspot.id;
      
      markerElement.className = `hotspot-marker ${dangerClass} ${pulseClass} ${isSelected ? 'selected' : ''}`.trim();
      markerElement.textContent = hotspot.label;
      
      markerElement.addEventListener('click', () => {
        debugLog(`Hotspot marker clicked: ${hotspot.id}`);
        useTampere().setSelectedHotspot(
          selectedHotspot && selectedHotspot.id === hotspot.id ? null : hotspot
        );
      });
      
      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: 'center'
      })
        .setLngLat(hotspot.coordinates)
        .addTo(map.current!);

      markersRef.current[`hotspot-${hotspot.id}`] = marker;
    });

    // Always show events
    debugLog(`Adding ${events.length} event markers`);
    events.forEach(event => {
      const markerElement = document.createElement("div");
      const pulseClass = "";  // Remove pulse effect from markers
      const isSelected = selectedEvent && selectedEvent.id === event.id;
      
      markerElement.innerHTML = `
        <div class="event-marker ${pulseClass} ${isSelected ? 'selected' : ''}">
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
      
      markerElement.addEventListener('click', () => {
        debugLog(`Event marker clicked: ${event.id}`);
        useTampere().setSelectedEvent(
          selectedEvent && selectedEvent.id === event.id ? null : event
        );
      });

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: 'center'
      })
        .setLngLat(event.coordinates)
        .addTo(map.current!);

      markersRef.current[`event-${event.id}`] = marker;
    });

    // Only show additional items when a hotspot or event is selected AND pulse is not active
    if ((selectedHotspot || selectedEvent) && !pulse) {
      debugLog(`Adding ${mapItems.length} additional map items`);
      mapItems.forEach(item => {
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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2">
                <path d="M6 22V2a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v20"></path>
                <path d="M18 11h3v11"></path>
                <path d="M3 22h18"></path>
                <path d="M15 2v7"></path>
                <rect x="10" y="14" width="2" height="2"></rect>
              </svg>
            `;
            markerElement.className = "text-orange-600";
            break;
          case "parking":
            iconHtml = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-parking-square">
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="M9 17V7h4a3 3 0 0 1 0 6H9"></path>
              </svg>
            `;
            markerElement.className = "text-blue-800";
            break;
          case "available":
            iconHtml = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-badge-check">
                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path>
                <path d="m9 12 2 2 4-4"></path>
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
  }, [hotspots, events, mapItems, selectedHotspot, selectedEvent, pulse, mapLoaded]);

  const showDetails = selectedEvent !== null || selectedHotspot !== null;

  // Log when showDetails changes
  useEffect(() => {
    debugLog(`ShowDetails changed: ${showDetails}`, { 
      hasSelectedHotspot: !!selectedHotspot, 
      hasSelectedEvent: !!selectedEvent 
    });
  }, [showDetails, selectedHotspot, selectedEvent]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (selectedHotspot || selectedEvent) {
      const coordinates = selectedHotspot ? selectedHotspot.coordinates : selectedEvent!.coordinates;
      
      // Calculate the offset to center vertically and shift slightly left
      // For half-height map, we need to adjust the pitch and offset
      const offsetOptions = {
        // Move point ~30% to the right of center (which appears left-biased in the viewport)
        offset: [window.innerWidth * 0.15, 0] as [number, number],
        // Additional options
        zoom: 15,
        essential: true,
        padding: { top: 50, bottom: 50, left: 50, right: 50 }
      };

      // Fly to the location with the calculated offset
      map.current.flyTo({
        center: coordinates,
        ...offsetOptions
      });
    }
  }, [selectedHotspot, selectedEvent, mapLoaded, showDetails]);

  // Debug effect to log container dimensions only on mount and resize
  useEffect(() => {
    if (!mapContainer.current) return;
    
    debugLog("Initial map container dimensions", {
      width: mapContainer.current.offsetWidth,
      height: mapContainer.current.offsetHeight,
      clientWidth: mapContainer.current.clientWidth,
      clientHeight: mapContainer.current.clientHeight,
      scrollWidth: mapContainer.current.scrollWidth,
      scrollHeight: mapContainer.current.scrollHeight,
      style: window.getComputedStyle(mapContainer.current),
      parentWidth: mapContainer.current.parentElement?.offsetWidth,
      parentHeight: mapContainer.current.parentElement?.offsetHeight,
    });
    
    const checkDimensions = () => {
      if (mapContainer.current) {
        debugLog("Map container dimensions on resize", {
          width: mapContainer.current.offsetWidth,
          height: mapContainer.current.offsetHeight,
          clientWidth: mapContainer.current.clientWidth,
          clientHeight: mapContainer.current.clientHeight,
          mapExists: !!map.current,
          mapLoaded: mapLoaded
        });
      }
    };
    
    window.addEventListener('resize', checkDimensions);
    return () => window.removeEventListener('resize', checkDimensions);
  }, [mapLoaded]);
  
  // Debug effect to show warning if container dimensions are too small
  useEffect(() => {
    if (!mapContainer.current) return;
    
    const checkDimensions = () => {
      const width = mapContainer.current?.offsetWidth || 0;
      const height = mapContainer.current?.offsetHeight || 0;
      
      if (width < 100 || height < 100) {
        debugLog("WARNING: Map container dimensions are too small", { width, height });
      }
    };
    
    checkDimensions();
    window.addEventListener('resize', checkDimensions);
    
    return () => window.removeEventListener('resize', checkDimensions);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col">
      <div
        ref={mapContainer}
        className={`w-full ${showDetails ? 'h-1/2' : 'h-full'} rounded-lg overflow-hidden border border-gray-200 relative`}
      >
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <div className="text-red-500 text-center p-4">
              <p className="font-bold">Error</p>
              <p>{mapError}</p>
            </div>
          </div>
        )}
        
        {/* Pulse toggle always visible */}
        <div className="absolute top-4 left-4 z-10">
          <PulseToggle 
            value={pulse} 
            onChange={(value) => {
              debugLog(`Pulse toggle changed to: ${value}`);
              setPulse(value);
            }} 
          />
        </div>
        
        {/* TimelineSlider only shown when an event or hotspot is selected */}
        {showDetails && (
          <div className="absolute bottom-4 left-4 z-10 w-48">
            <TimelineSlider
              value={timelineRange}
              onChange={setTimelineRange}
              label="Timeline"
              compact={true}
            />
          </div>
        )}
      </div>
      
      {showDetails && (
        <div className="w-full h-1/2 relative p-4">
          {/* Lower half section - empty for now */}
        </div>
      )}
    </div>
  );
};

