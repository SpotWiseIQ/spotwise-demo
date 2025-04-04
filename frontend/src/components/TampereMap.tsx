import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTampere } from "@/lib/TampereContext";
import { MapLegend } from "./MapLegend";
import { PulseToggle } from "./PulseToggle";
import { fetchMapItems, fetchTrafficData, fetchTampereCenter } from "@/lib/api";
import { MapItem } from "@/lib/types";
import { LocationMetrics } from "./LocationMetrics";

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

  // Add new state for tracking expanded metrics
  const [isAnyCardExpanded, setIsAnyCardExpanded] = useState(false);

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
        if (selectedHotspot || selectedEvent) {
          const coordinates = selectedHotspot 
            ? selectedHotspot.coordinates 
            : selectedEvent!.coordinates;
          
          debugLog("API call: fetchMapItems for selected location");
          let items = await fetchMapItems(coordinates[1], coordinates[0], 400);
          debugLog("Map items fetched successfully", items);
          
          // Check if we have at least one of each type
          const availableTypes: MapItem['type'][] = ['bus', 'tram', 'business', 'parking', 'available'];
          const existingTypes = new Set(items.map(item => item.type));
          
          // For missing types, generate mock items with random positions
          const missingTypes = availableTypes.filter(type => !existingTypes.has(type));
          
          if (missingTypes.length > 0) {
            debugLog(`Requesting missing types from backend: ${missingTypes.join(', ')}`);
            
            // Request additional items from backend
            const additionalItems = await fetchMapItems(
              coordinates[1],
              coordinates[0],
              400,
              missingTypes
            );
            
            // Combine original and additional items
            items = [...items, ...additionalItems];
            debugLog("Received additional items from backend", additionalItems);
          }
          
          setMapItems(items);
        } else {
          // Clear map items when nothing is selected
          setMapItems([]);
        }
      } catch (error) {
        console.error("Failed to fetch map items:", error);
        debugLog("Error fetching map items", error);
        setMapItems([]);
      }
    };

    getMapItems();
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

    // If there's a selected item, only show that item
    if (selectedHotspot || selectedEvent) {
      if (selectedHotspot) {
        // Only show the selected hotspot
        debugLog(`Adding only selected hotspot marker: ${selectedHotspot.id}`);
        const markerElement = document.createElement("div");
        const trafficClass = selectedHotspot.trafficLevel || "medium";
        const pulseClass = "";  // Remove pulse effect from markers
        
        markerElement.className = `hotspot-marker ${trafficClass} ${pulseClass} selected`.trim();
        markerElement.textContent = selectedHotspot.label;
        
        markerElement.addEventListener('click', () => {
          debugLog(`Selected hotspot marker clicked: ${selectedHotspot.id}`);
          useTampere().setSelectedHotspot(null);
        });
        
        const marker = new maplibregl.Marker({
          element: markerElement,
          anchor: 'center'
        })
          .setLngLat(selectedHotspot.coordinates)
          .addTo(map.current!);

        markersRef.current[`hotspot-${selectedHotspot.id}`] = marker;
      } else if (selectedEvent) {
        // Only show the selected event
        debugLog(`Adding only selected event marker: ${selectedEvent.id}`);
        const markerElement = document.createElement("div");
        const pulseClass = "";  // Remove pulse effect from markers
        
        markerElement.innerHTML = `
          <div class="event-marker ${pulseClass} selected">
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
          debugLog(`Selected event marker clicked: ${selectedEvent.id}`);
          useTampere().setSelectedEvent(null);
        });

        const marker = new maplibregl.Marker({
          element: markerElement,
          anchor: 'center'
        })
          .setLngLat(selectedEvent.coordinates)
          .addTo(map.current!);

        markersRef.current[`event-${selectedEvent.id}`] = marker;
      }
      
      // Show additional items when a hotspot or event is selected
      debugLog(`Adding ${mapItems.length} additional map items`);
      mapItems.forEach((item: MapItem) => {
        let markerElement = document.createElement("div");
        let iconHtml = '';
        
        switch (item.type) {
          case "bus":
            iconHtml = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus">
                <path d="M19 17h2l.64-2.54c.24-.959.24-1.962 0-2.92l-1.07-4.27A3 3 0 0 0 17.66 5H4a2 2 0 0 0-2 2v10h2"></path>
                <path d="M14 17H9"></path>
                <circle cx="6.5" cy="17.5" r="2.5"></circle>
                <circle cx="16.5" cy="17.5" r="2.5"></circle>
              </svg>
            `;
            markerElement.className = "map-icon-container text-blue-600";
            break;
          case "tram":
            iconHtml = `
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
            markerElement.className = "map-icon-container text-purple-700";
            break;
          case "business":
            iconHtml = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store">
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path>
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path>
                <path d="M2 7h20"></path>
                <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"></path>
              </svg>
            `;
            markerElement.className = "map-icon-container text-orange-600";
            break;
          case "parking":
            iconHtml = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-parking">
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="M9 17V7h4a3 3 0 0 1 0 6H9"></path>
              </svg>
            `;
            markerElement.className = "map-icon-container text-blue-800";
            break;
          case "available":
            iconHtml = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-dot">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="1"></circle>
              </svg>
            `;
            markerElement.className = "map-icon-container text-green-600";
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
    } else {
      // Show all hotspots when nothing is selected
      debugLog(`Adding ${hotspots.length} hotspot markers`);
      hotspots.forEach(hotspot => {
        const markerElement = document.createElement("div");
        const trafficClass = hotspot.trafficLevel || "medium";
        const pulseClass = "";  // Remove pulse effect from markers
        
        markerElement.className = `hotspot-marker ${trafficClass} ${pulseClass}`.trim();
        markerElement.textContent = hotspot.label;
        
        markerElement.addEventListener('click', () => {
          debugLog(`Hotspot marker clicked: ${hotspot.id}`);
          useTampere().setSelectedHotspot(hotspot);
        });
        
        const marker = new maplibregl.Marker({
          element: markerElement,
          anchor: 'center'
        })
          .setLngLat(hotspot.coordinates)
          .addTo(map.current!);

        markersRef.current[`hotspot-${hotspot.id}`] = marker;
      });

      // Show all events when nothing is selected
      debugLog(`Adding ${events.length} event markers`);
      events.forEach(event => {
        const markerElement = document.createElement("div");
        const pulseClass = "";  // Remove pulse effect from markers
        
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
        
        markerElement.addEventListener('click', () => {
          debugLog(`Event marker clicked: ${event.id}`);
          useTampere().setSelectedEvent(event);
        });

        const marker = new maplibregl.Marker({
          element: markerElement,
          anchor: 'center'
        })
          .setLngLat(event.coordinates)
          .addTo(map.current!);

        markersRef.current[`event-${event.id}`] = marker;
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
      
      // Center the map on the selected point with appropriate zoom level
      map.current.flyTo({
        center: coordinates,
        zoom: 15.5,  // Slightly increased zoom level for better visibility
        essential: true,
        padding: { 
          top: 50, 
          bottom: 50, 
          left: 50, 
          right: 50 
        }
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
        className={`w-full transition-all duration-300 ${
          showDetails 
            ? isAnyCardExpanded 
              ? 'h-1/3' // Smaller map when details shown and card expanded
              : 'h-1/2' // Normal split when details shown
            : 'h-full'  // Full height when no details
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
        
        {/* Map Legend on left side, vertically centered */}
        {showDetails && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <MapLegend />
          </div>
        )}
      </div>
      
      {showDetails && (
        <div className={`w-full transition-all duration-300 ${
          isAnyCardExpanded ? 'h-2/3' : 'h-1/2'
        } relative`}>
          <LocationMetrics onAnyCardExpanded={setIsAnyCardExpanded} />
        </div>
      )}
    </div>
  );
};

