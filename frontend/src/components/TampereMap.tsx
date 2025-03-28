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

  // Fetch map items when needed
  useEffect(() => {
    if (selectedHotspot || selectedEvent) {
      debugLog(`Fetching map items for ${selectedHotspot ? 'hotspot' : 'event'}`);
      const getMapItems = async () => {
        try {
          debugLog("API call: fetchMapItems");
          const items = await fetchMapItems();
          debugLog(`Fetched ${items.length} map items successfully`);
          setMapItems(items);
        } catch (error) {
          console.error("Failed to fetch map items:", error);
          debugLog("Error fetching map items");
          setMapItems([]);
        }
      };

      getMapItems();
    }
  }, [selectedHotspot, selectedEvent]);

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
      const pulseClass = pulse ? "animate-pulse-effect" : "";
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
      const pulseClass = pulse ? "animate-pulse-effect" : "";
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

    // Only show additional items when a hotspot or event is selected
    if (selectedHotspot || selectedEvent) {
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
      
      // Update traffic lines data
      if (map.current.getSource('traffic')) {
        debugLog("Fetching traffic data for selected item");
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
            if (map.current && map.current.getSource('traffic')) {
              // Set empty traffic data on error
              (map.current.getSource('traffic') as maplibregl.GeoJSONSource).setData({
                type: "FeatureCollection",
                features: [],
              });
            }
          });
      }
    } else {
      // Clear traffic lines when nothing is selected
      if (map.current && map.current.getSource('traffic')) {
        debugLog("Clearing traffic data - no selection");
        (map.current.getSource('traffic') as maplibregl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [],
        });
      }
    }
  }, [hotspots, events, mapItems, selectedHotspot, selectedEvent, pulse, mapLoaded]);

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

  // Log when showDetails changes
  useEffect(() => {
    debugLog(`ShowDetails changed: ${showDetails}`, { 
      hasSelectedHotspot: !!selectedHotspot, 
      hasSelectedEvent: !!selectedEvent 
    });
  }, [showDetails, selectedHotspot, selectedEvent]);

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
      {/* Debug dimensions overlay */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="absolute top-0 left-0 z-50 bg-black bg-opacity-70 text-white text-xs p-1 pointer-events-none">
          W: {mapContainer.current?.offsetWidth || 0} x H: {mapContainer.current?.offsetHeight || 0}
          {!mapLoaded && " | Map not loaded"}
          {mapError && " | Error"}
        </div>
      )}
      
      <div ref={mapContainer} className="w-full h-full flex-grow relative">
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-75 z-10">
            <div className="bg-white p-4 rounded-md shadow-md">
              <h3 className="text-red-600 font-medium">Map Error</h3>
              <p>{mapError}</p>
            </div>
          </div>
        )}
        {loading && !mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Map controls - moved to top-left to avoid collision with navigation controls */}
      <div className="absolute top-4 left-4 z-10">
        <PulseToggle value={pulse} onChange={value => useTampere().setPulse(value)} />
      </div>
      
      {/* Only show these components when a hotspot or event is selected */}
      {showDetails && (
        <>
          <div className="absolute bottom-4 right-4 z-10">
            <MapLegend />
          </div>
          
          <div className="absolute bottom-4 left-4 z-10 w-48">
            <TimelineSlider 
              value={timelineRange} 
              onChange={setTimelineRange} 
              compact={true}
              label="Timeline"
            />
          </div>
        </>
      )}
    </div>
  );
};

