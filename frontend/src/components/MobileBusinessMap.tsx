import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTampere } from "@/lib/TampereContext";
import { MobileBusinessLegend } from "./MobileBusinessLegend";
import { PulseToggle } from "./PulseToggle";
import { fetchMapItems, fetchTrafficData, fetchTrafficPoints, fetchTampereCenter } from "@/lib/api";
import { MapItem } from "@/lib/types";
import { LocationMetrics } from "./LocationMetrics";
import { ComparisonView } from "./ComparisonView";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`%c🗺️ MAP DEBUG: ${message}`, 'background: #f0f0f0; color: #0066cc; font-weight: bold; padding: 2px 5px; border-radius: 3px;', data || '');
};

// Add specialized debug function for fetch operations
const debugFetch = (message: string, data?: any) => {
  console.log(`%c🔍 FETCH DEBUG: ${message}`, 'background: #fff0f0; color: #cc0066; font-weight: bold; padding: 2px 5px; border-radius: 3px;', data || '');
};

export const MobileBusinessMap: React.FC = () => {
  const context = useTampere();
  
  // Derived state for backward compatibility
  const hotspots = context.locations ? context.locations.filter(loc => loc.type === 'natural') : [];
  const events = context.locations ? context.locations.filter(loc => loc.type === 'event') : [];
  const selectedHotspot = context.selectedLocation?.type === 'natural' ? context.selectedLocation : null;
  const selectedEvent = context.selectedLocation?.type === 'event' ? context.selectedLocation : null;
  const pulse = context.pulse;
  const loading = context.loading;
  const timelineRange = context.timelineRange;
  const selectedDate = context.selectedDate;
  
  // Helper functions to maintain compatibility
  const setPulse = context.setPulse;
  const setSelectedHotspot = (hotspot: any) => {
    context.setSelectedLocation(hotspot);
  };
  
  const setSelectedEvent = (event: any) => {
    context.setSelectedLocation(event);
  };
  
  // Derived state for comparison modes
  const isHotspotCompareMode = context.isCompareMode && context.selectedLocationsForComparison.some(loc => loc.type === 'natural');
  const isEventCompareMode = context.isCompareMode && context.selectedLocationsForComparison.some(loc => loc.type === 'event');
  const selectedHotspotsForComparison = context.selectedLocationsForComparison.filter(loc => loc.type === 'natural');
  const selectedEventsForComparison = context.selectedLocationsForComparison.filter(loc => loc.type === 'event');

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapItems, setMapItems] = useState<MapItem[]>([]);
  const [tampereCenter, setTampereCenter] = useState<[number, number]>([23.761, 61.4978]); // Default center

  // Add refresh trigger for overview markers
  const [markerRefreshTrigger, setMarkerRefreshTrigger] = useState(0);

  // Add new state for tracking expanded metrics
  const [isAnyCardExpanded, setIsAnyCardExpanded] = useState(false);

  // Track if map items are currently being loaded
  const [loadingMapItems, setLoadingMapItems] = useState(false);
  
  // SEQUENCE FIX: Create a ref to track the latest coordinates for fly-to
  const pendingFlyToRef = useRef<[number, number] | null>(null);
  
  // --- Traffic Data Caching and Hour Change Logic ---
  const trafficDataCache = useRef<{ [key: string]: any }>({});
  const trafficPointsCache = useRef<{ [key: string]: any }>({});
  const prevSliderHour = useRef<number | null>(null);
  const prevSystemHour = useRef<number | null>(null);
  const isFirstLoad = useRef(true);
  
  // Track if pulse was manually toggled to preserve user preference
  const pulseManuallyToggled = useRef(false);

  // Helper to get hour from timelineRange.start (0-100) and selectedDate
  function getSliderHour() {
    // Convert slider percentage to hour (0-23)
    return Math.round((timelineRange?.start ?? 0) / 100 * 24);
  }
  function getSystemHour() {
    const now = new Date();
    return now.getHours();
  }
  function getDateKey(date: Date) {
    return date.toISOString().split('T')[0];
  }

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
        
        // Validate coordinates before setting them
        if (Array.isArray(center) && center.length === 2 && 
            !isNaN(center[0]) && !isNaN(center[1])) {
          setTampereCenter(center);
        } else {
          throw new Error('Invalid coordinates returned');
        }
      } catch (error) {
        console.error("Failed to fetch Tampere center:", error);
        debugLog("Error fetching Tampere center, using default", [23.7609, 61.4978]);
        // Keep using the default center
      }
    };

    getTampereCenter();
  }, []);

  // Make sure tampereCenter has valid coordinates
  useEffect(() => {
    // Set default coordinates if tampereCenter is invalid
    if (!tampereCenter || 
        !Array.isArray(tampereCenter) || 
        tampereCenter.length !== 2 ||
        isNaN(tampereCenter[0]) || 
        isNaN(tampereCenter[1])) {
      debugLog("Invalid tampereCenter detected, resetting to default coordinates");
      setTampereCenter([23.7609, 61.4978]);
    }
  }, [tampereCenter]);

  // Add immediate fly-to effect that runs as soon as selection changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const coordinates = selectedHotspot?.coordinates || selectedEvent?.coordinates;
    if (coordinates) {
      debugLog("Immediate fly to coordinates", coordinates);
      
      // Calculate vertical offset based on container height
      const containerHeight = mapContainer.current?.offsetHeight || 0;
      
      // Increase the vertical offset to account for the metrics component at the bottom
      const verticalOffset = containerHeight * 0.25; // Increased from 0.2 to 0.25
      
      // Calculate additional offset to compensate for the metrics panel at the bottom
      // This shifts the focal point up to keep marker centered in the visible area
      const bottomOffsetAdjustment = isAnyCardExpanded ? containerHeight * 0.15 : containerHeight * 0.1;

      map.current.flyTo({
        center: coordinates,
        zoom: 15.5,
        essential: true,
        duration: 1000, // 1 second transition
        padding: {
          top: 60, // Reduced top padding
          bottom: verticalOffset + 80, // Increased bottom padding to account for metrics panel
          left: 50,
          right: 50,
        },
        offset: [0, -bottomOffsetAdjustment] // Increased negative offset to move focus point higher
      });
    }
  }, [selectedHotspot, selectedEvent, mapLoaded, isAnyCardExpanded]);

  // Fetch map items
  useEffect(() => {
    debugLog("Fetch map items start", {
      hasSelectedHotspot: !!selectedHotspot,
      hasSelectedEvent: !!selectedEvent
    });

    let isMounted = true;
    const { detailedMetrics, loadHotspotDetailedMetrics, loadEventDetailedMetrics } = context;

    const getMapItemsFromMetrics = (metrics: any): MapItem[] => {
      if (!metrics) {
        debugLog('No metrics data provided');
        return [];
      }

      // Debug the entire metrics object to see its structure
      debugLog('Detailed metrics structure', {
        hasPlacesForRent: !!metrics.places_for_rent,
        placesForRentLength: metrics.places_for_rent?.length,
        hasPlacesOfInterest: !!metrics.places_of_interest,
        placesOfInterestLength: metrics.places_of_interest?.length,
        hasPois: !!metrics.pois,
        poisLength: metrics.pois?.length,
        hasCompanies: !!metrics.companies,
        companiesLength: metrics.companies?.length,
        metricsKeys: Object.keys(metrics)
      });

      // Combined items array
      const items: MapItem[] = [];
      
      // Handle places_for_rent (all mapped to "available" type)
      if (metrics.places_for_rent && Array.isArray(metrics.places_for_rent)) {
        debugLog('Raw places_for_rent data', metrics.places_for_rent);
        
        const placesForRent = metrics.places_for_rent.map((place: any, index: number) => {
          // Extract coordinates, handling different possible formats
          let coordinates: [number, number] | null = null;
          
          if (Array.isArray(place.coordinates) && place.coordinates.length === 2) {
            coordinates = place.coordinates as [number, number];
          } else if (place.longitude !== undefined && place.latitude !== undefined) {
            coordinates = [parseFloat(place.longitude), parseFloat(place.latitude)];
          }
          
          // Skip if no valid coordinates
          if (!coordinates || coordinates.some(c => isNaN(c))) {
            debugLog(`Invalid coordinates for place_for_rent at index ${index}`, place);
            return null;
          }
          
          return {
            type: 'available',
            id: place.id || `rent-${index}`,
            coordinates,
            label: place.name || 'Available Space',
          };
        }).filter(Boolean) as MapItem[];
        
        items.push(...placesForRent);
        debugLog(`Added ${placesForRent.length} places_for_rent items`);
      } else {
        debugLog('No places_for_rent data found or not in expected format');
      }

      // Handle places_of_interest or pois (mapped based on category)
      const poisData = metrics.places_of_interest || metrics.pois || [];
      
      if (Array.isArray(poisData) && poisData.length > 0) {
        debugLog('Raw POIs data', poisData);
        
        const placesOfInterest = poisData.map((poi: any, index: number) => {
          // Extract coordinates, handling different possible formats
          let coordinates: [number, number] | null = null;
          
          if (Array.isArray(poi.coordinates) && poi.coordinates.length === 2) {
            coordinates = poi.coordinates as [number, number];
          } else if (poi.longitude !== undefined && poi.latitude !== undefined) {
            coordinates = [parseFloat(poi.longitude), parseFloat(poi.latitude)];
          }
          
          // Skip if no valid coordinates
          if (!coordinates || coordinates.some(c => isNaN(c))) {
            debugLog(`Invalid coordinates for POI at index ${index}`, poi);
            return null;
          }
          
          // Map category to icon type
          const type = mapCategoryToIconType(poi.category);
          return {
            type,
            id: poi.id || poi.poi_id || `poi-${index}`,
            coordinates,
            label: poi.name || poi.category || 'Point of Interest',
          };
        }).filter(Boolean) as MapItem[];
        
        items.push(...placesOfInterest);
        debugLog(`Added ${placesOfInterest.length} POI items`);
      } else {
        debugLog('No POI data found or not in expected format');
      }
      
      // Handle companies as business points if available
      if (metrics.companies && Array.isArray(metrics.companies) && metrics.companies.length > 0) {
        debugLog('Raw companies data', metrics.companies);
        
        const companies = metrics.companies.map((company: any, index: number) => {
          // Extract coordinates, handling different possible formats
          let coordinates: [number, number] | null = null;
          
          if (Array.isArray(company.coordinates) && company.coordinates.length === 2) {
            coordinates = company.coordinates as [number, number];
          } else if (company.longitude !== undefined && company.latitude !== undefined) {
            coordinates = [parseFloat(company.longitude), parseFloat(company.latitude)];
          }
          
          // Skip if no valid coordinates
          if (!coordinates || coordinates.some(c => isNaN(c))) {
            debugLog(`Invalid coordinates for company at index ${index}`, company);
            return null;
          }
          
          return {
            type: 'business',
            id: company.id || company.company_id || `company-${index}`,
            coordinates,
            label: company.name || 'Business',
          };
        }).filter(Boolean) as MapItem[];
        
        items.push(...companies);
        debugLog(`Added ${companies.length} company items`);
      }
      
      // If no items found and in development, add mock data for testing
      if (items.length === 0 && process.env.NODE_ENV === 'development') {
        const mockItems: MapItem[] = [
          {
            type: 'available',
            id: 'mock-rent-1',
            coordinates: [23.8020, 61.5055], // Offset from the center
            label: 'Mock Available Spot'
          },
          {
            type: 'parking',
            id: 'mock-parking-1',
            coordinates: [23.8030, 61.5045], // Offset from the center
            label: 'Mock Parking'
          },
          {
            type: 'bus',
            id: 'mock-bus-1',
            coordinates: [23.8010, 61.5040], // Offset from the center
            label: 'Mock Bus Stop'
          }
        ];
        items.push(...mockItems);
        debugLog('Added mock map items for testing', mockItems);
      }
      
      // Final validation of all items
      const validItems = items.filter(item => {
        const isValid = item && 
                        item.coordinates && 
                        Array.isArray(item.coordinates) && 
                        item.coordinates.length === 2 && 
                        !item.coordinates.some(isNaN);
        
        if (!isValid) {
          debugLog('Filtering out invalid map item', item);
        }
        
        return isValid;
      });
      
      debugLog(`Final map items count: ${validItems.length}`);
      return validItems;
    };

    // Helper function to map POI category to icon type
    const mapCategoryToIconType = (category: string): string => {
      if (!category) return 'business';
      
      const categoryLower = category.toLowerCase();
      
      if (categoryLower.includes('parking')) return 'parking';
      if (categoryLower.includes('bus') || categoryLower.includes('bus stop')) return 'bus';
      if (categoryLower.includes('tram') || categoryLower.includes('tram stop')) return 'tram';
      if (categoryLower.includes('available') || categoryLower.includes('for rent')) return 'available';
      
      // Default to business for any other category
      return 'business';
    };

    const fetchAndSetMetrics = async (location: any, isHotspot: boolean) => {
      setLoadingMapItems(true);
      try {
        let metrics = null;
        if (isHotspot) {
          debugFetch(`Loading hotspot detailed metrics for ${location.id}`);
          metrics = await loadHotspotDetailedMetrics(location.id);
        } else {
          debugFetch(`Loading event detailed metrics for ${location.id}`);
          metrics = await loadEventDetailedMetrics(location.id);
        }
        
        // Check if metrics has detailed property (new API format)
        if (metrics && metrics.detailed) {
          debugFetch("Found 'detailed' property in metrics response", metrics.detailed);
          // Move POIs and companies into the main metrics object to maintain backward compatibility
          if (metrics.detailed.pois) {
            metrics.pois = metrics.detailed.pois;
            debugFetch(`Found ${metrics.pois.length} POIs in detailed.pois`);
          }
          if (metrics.detailed.places_for_rent) {
            metrics.places_for_rent = metrics.detailed.places_for_rent;
            debugFetch(`Found ${metrics.places_for_rent.length} places for rent in detailed.places_for_rent`);
          }
          if (metrics.detailed.companies) {
            metrics.companies = metrics.detailed.companies;
            debugFetch(`Found ${metrics.companies.length} companies in detailed.companies`);
          }
        }
        
        // Do NOT setDetailedMetrics here; let the card selection logic handle it
        if (isMounted) {
          const mapItemsResult = getMapItemsFromMetrics(metrics);
          debugFetch(`Setting ${mapItemsResult.length} map items from metrics`);
          setMapItems(mapItemsResult);
          debugLog("Map items set from freshly loaded detailed metrics (local only)", metrics);
        }
      } catch (error) {
        if (isMounted) {
          setMapItems([]);
          debugLog("Error loading detailed metrics for map items", error);
          console.error("Failed to load detailed metrics:", error);
        }
      } finally {
        if (isMounted) setLoadingMapItems(false);
      }
    };

    if (selectedHotspot || selectedEvent) {
      const selected = selectedHotspot || selectedEvent;
      const isHotspot = !!selectedHotspot;
      // Only fetch if context.detailedMetrics is null or for a different location
      if (!context.detailedMetrics || context.detailedMetrics.id !== selected.id) {
        fetchAndSetMetrics(selected, isHotspot);
      } else {
        setMapItems(getMapItemsFromMetrics(context.detailedMetrics));
        debugLog("Map items set from cached detailed metrics", context.detailedMetrics);
      }
    } else {
      setMapItems([]);
      debugLog("Fetch map items cleared");
    }

    return () => {
      isMounted = false;
    };
  }, [selectedHotspot, selectedEvent, context.detailedMetrics]);

  // Update map initialization to wait for tampereCenter to be set
  useEffect(() => {
    debugLog("Map initialization effect triggered");
    debugLog(`Map container exists: ${!!mapContainer.current}`);
    debugLog(`Map instance exists: ${!!map.current}`);
    debugLog("Using tampereCenter: ", tampereCenter);

    // Don't initialize if container is missing, map already exists, or tampereCenter is invalid
    if (!mapContainer.current || map.current) return;
    
    // Make extra sure we have valid coordinates
    if (isNaN(tampereCenter[0]) || isNaN(tampereCenter[1])) {
      console.error("Invalid coordinates for map initialization:", tampereCenter);
      debugLog("Invalid tampereCenter coordinates, cannot initialize map");
      return;
    }

    debugLog("Initializing map with center", tampereCenter);
    debugLog("Map container dimensions", {
      width: mapContainer.current.offsetWidth,
      height: mapContainer.current.offsetHeight,
    });

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: "https://tiles.openfreemap.org/styles/positron",
        center: tampereCenter,
        zoom: 11,
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

        // Add source for traffic lines
        map.current?.addSource("traffic-lines", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });
        debugLog("Traffic lines source added");

        // Add source for traffic points
        map.current?.addSource("traffic-points", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });
        debugLog("Traffic points source added");

        // Add heatmap layer for traffic visualization using points
        map.current?.addLayer({
          id: "traffic-heatmap",
          type: "heatmap",
          source: "traffic-points",
          paint: {
            // Adjust weight based on traffic status
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10,
              ['match',
                ['get', 'status'],
                'congested', 1.0,
                'moderate', 0.8,
                'available', 0.1,
                0
              ],
              15,
              ['match',
                ['get', 'status'],
                'congested', 1.0,
                'moderate', 0.8,
                'available', 0.1,
                0
              ]
            ],
            // Adjust intensity based on zoom level
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 0.5,    // Base intensity at low zoom
              12, 0.6,    // Moderate increase
              14, 0.7,    // Keep moderate intensity at high zoom
              16, 0.7     // Keep moderate intensity at max zoom
            ],
            // Color gradient for the heatmap with new colors
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(245, 245, 245, 0)',    // Transparent off-white
              0.2, 'rgba(245, 245, 245, 0.7)', // Semi-transparent off-white
              0.5, 'rgba(192, 163, 192, 0.8)', // Dusty lavender
              0.8, 'rgba(255, 46, 46, 0.9)',   // Semi-transparent vivid red
              1, 'rgba(255, 46, 46, 1.0)'      // Fully opaque vivid red
            ],
            // Adjust radius to maintain strong blending at high zoom levels
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 10,     // Original radius at low zoom
              12, 15,     // Moderate increase at medium-low zoom
              14, 30,     // Larger radius at medium-high zoom
              16, 60      // Very large radius at max zoom for complete blending
            ],
            // Adjust opacity to maintain consistent blend
            'heatmap-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 0.6,    // Base opacity at low zoom
              12, 0.7,    // Slight increase at medium zoom
              14, 0.7,    // Keep consistent at high zoom
              16, 0.7     // Keep consistent at max zoom
            ]
          }
        });

        map.current?.addLayer({
          id: "traffic-lines",
          type: "line",
          source: "traffic-lines",
          layout: {
            "line-join": "round",
            "line-cap": "round",
            // Only show lines when pulse is on
            "visibility": "none"
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
              "#c83e36",
              "#000000",
            ],
            "line-opacity": 0.7,
          },
        });
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

    const sliderHour = getSliderHour();
    const systemHour = getSystemHour();
    const dateKey = getDateKey(selectedDate || new Date());
    const cacheKey = `${dateKey}-${sliderHour}`;

    let shouldFetch = false;

    // First load
    if (isFirstLoad.current) {
      shouldFetch = true;
      isFirstLoad.current = false;
    }
    // Slider hour changed
    else if (prevSliderHour.current !== sliderHour) {
      shouldFetch = true;
    }
    // System hour changed
    else if (prevSystemHour.current !== systemHour) {
      shouldFetch = true;
    }

    prevSliderHour.current = sliderHour;
    prevSystemHour.current = systemHour;

    if (shouldFetch) {
      debugLog(`Fetching traffic data for hour ${sliderHour} (cacheKey=${cacheKey})`);
      // Fetch and cache traffic points
      fetchTrafficPoints().then((pointsData) => {
        if (!pointsData) return;
        trafficPointsCache.current[cacheKey] = pointsData;
        if (map.current && map.current.getSource("traffic-points")) {
          (
            map.current.getSource("traffic-points") as maplibregl.GeoJSONSource
          ).setData(pointsData);
        }
      }).catch(err => {
        console.error("Error fetching traffic points:", err);
      });
      
      // Fetch and cache traffic data
      fetchTrafficData().then((trafficData) => {
        if (!trafficData) return;
        trafficDataCache.current[cacheKey] = trafficData;
        if (map.current && map.current.getSource("traffic-lines")) {
          (
            map.current.getSource("traffic-lines") as maplibregl.GeoJSONSource
          ).setData(trafficData);
        }
      }).catch(err => {
        console.error("Error fetching traffic data:", err);
      });
    } else {
      // Use cached data if available
      debugLog(`Using cached traffic data for hour ${sliderHour} (cacheKey=${cacheKey})`);
      const cachedPoints = trafficPointsCache.current[cacheKey];
      const cachedTraffic = trafficDataCache.current[cacheKey];
      if (cachedPoints && map.current && map.current.getSource("traffic-points")) {
        (
          map.current.getSource("traffic-points") as maplibregl.GeoJSONSource
        ).setData(cachedPoints);
      }
      if (cachedTraffic && map.current && map.current.getSource("traffic-lines")) {
        (
          map.current.getSource("traffic-lines") as maplibregl.GeoJSONSource
        ).setData(cachedTraffic);
      }
    }

    // Toggle visibility of traffic layers based on selection and pulse state
    if (map.current) {
      // Hide heatmap when a selection is made, show otherwise
      map.current.setLayoutProperty(
        "traffic-heatmap",
        "visibility",
        selectedHotspot || selectedEvent ? "none" : "visible"
      );

      // Show traffic lines only when pulse is on
      map.current.setLayoutProperty(
        "traffic-lines",
        "visibility",
        pulse ? "visible" : "none"
      );
    }
  }, [pulse, mapLoaded, selectedHotspot, selectedEvent, timelineRange, selectedDate]);

  // Update map markers and traffic data for selected items
  useEffect(() => {
    if (!map.current || !mapLoaded) {
      debugLog(
        `Skipping markers update - Map ready: ${!!map.current}, Map loaded: ${mapLoaded}`
      );
      return;
    }

    debugLog("Markers update start", {
      markersCount: Object.keys(markersRef.current).length,
      hasSelectedHotspot: !!selectedHotspot,
      hasSelectedEvent: !!selectedEvent,
      mapItems: mapItems?.length || 0
    });
    
    // Remove all existing markers
    const markerCount = Object.keys(markersRef.current).length;
    debugLog(`Removing ${markerCount} existing markers`);
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Add markers based on selection state
    if (selectedHotspot && map.current) {
      // Add selected hotspot marker
      const markerElement = document.createElement("div");
      const trafficClass = selectedHotspot.trafficLevel || "medium";
      markerElement.className = `hotspot-card ${trafficClass} map-hotspot-marker selected`;
      markerElement.textContent = selectedHotspot.label;

      // Create popup for hover effect
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: [0, -30],
        className: 'marker-tooltip',
        anchor: 'bottom'
      }).setText(selectedHotspot.name || `${selectedHotspot.label} Zone`);

      markerElement.addEventListener("mouseenter", () => {
        popup.addTo(map.current!);
      });

      markerElement.addEventListener("mouseleave", () => {
        popup.remove();
      });

      markerElement.addEventListener("click", () => {
        debugLog(`Selected hotspot marker clicked: ${selectedHotspot.id}`);
        setSelectedHotspot(null);
      });

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: "center",
      })
        .setLngLat(selectedHotspot.coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current[`hotspot-${selectedHotspot.id}`] = marker;

      // Add additional map items with tooltips
      if (mapItems && mapItems.length > 0) {
        mapItems.forEach((item: MapItem) => {
          if (!item || !item.coordinates) return;
          
          // Create marker element without position:relative
          let markerElement = document.createElement("div");
          // The maplibregl-marker wrapper will handle positioning
          markerElement.className = `map-icon-container ${getMapItemColor(item.type)}`;
          markerElement.innerHTML = getMapItemIcon(item.type);

          // Create popup for hover effect
          const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: [0, -30],
            className: 'marker-tooltip',
            anchor: 'bottom'
          }).setText(item.label || (item.type.charAt(0).toUpperCase() + item.type.slice(1)));

          markerElement.addEventListener("mouseenter", () => {
            popup.addTo(map.current!);
          });

          markerElement.addEventListener("mouseleave", () => {
            popup.remove();
          });

          // Let MapLibre handle the absolute positioning
          const marker = new maplibregl.Marker({
            element: markerElement,
            anchor: "center",
          })
            .setLngLat(item.coordinates)
            .setPopup(popup)
            .addTo(map.current!);

          // Store reference for cleanup
          markersRef.current[`${item.type}-${item.id}`] = marker;
          
          // Debug log for verification
          debugLog(`Added marker for ${item.type}: ${item.label || item.id} at [${item.coordinates}]`);
        });
      }
    } else if (selectedEvent && map.current) {
      // Add selected event marker
      const markerElement = document.createElement("div");
      const eventId = selectedEvent.id || selectedEvent.event_id;
      const eventLabel = 'label' in selectedEvent ? selectedEvent.label : '';
      const eventName = selectedEvent.name || selectedEvent.event_name || '';
      const eventCoordinates = selectedEvent.coordinates;
      // Always use the same base class, add 'highlighted' if selected
      markerElement.className = "event-marker" + (selectedEvent && (selectedEvent.id || selectedEvent.event_id) === eventId ? " highlighted" : "");
      markerElement.textContent = eventLabel;

      // Create popup for hover effect
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: [0, -30],
        className: 'marker-tooltip',
        anchor: 'bottom'
      }).setText(selectedEvent.event_name || selectedEvent.name || '');

      markerElement.addEventListener("mouseenter", () => {
        popup.addTo(map.current!);
      });

      markerElement.addEventListener("mouseleave", () => {
        popup.remove();
      });

      markerElement.addEventListener("click", () => {
        debugLog(`Event marker clicked: ${eventId}`);
        setSelectedEvent(selectedEvent);
      });

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: "center",
        offset: [0, -12], // Custom offset for visual centering
      })
        .setLngLat(eventCoordinates)
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current[`event-${eventId}`] = marker;

      // Add additional map items with tooltips
      if (mapItems && mapItems.length > 0) {
        mapItems.forEach((item: MapItem) => {
          if (!item || !item.coordinates) return;
          
          // Create marker element without position:relative
          let markerElement = document.createElement("div");
          // The maplibregl-marker wrapper will handle positioning
          markerElement.className = `map-icon-container ${getMapItemColor(item.type)}`;
          markerElement.innerHTML = getMapItemIcon(item.type);

          // Create popup for hover effect
          const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: [0, -30],
            className: 'marker-tooltip',
            anchor: 'bottom'
          }).setText(item.label || (item.type.charAt(0).toUpperCase() + item.type.slice(1)));

          markerElement.addEventListener("mouseenter", () => {
            popup.addTo(map.current!);
          });

          markerElement.addEventListener("mouseleave", () => {
            popup.remove();
          });

          // Let MapLibre handle the absolute positioning
          const marker = new maplibregl.Marker({
            element: markerElement,
            anchor: "center",
          })
            .setLngLat(item.coordinates)
            .setPopup(popup)
            .addTo(map.current!);

          // Store reference for cleanup
          markersRef.current[`${item.type}-${item.id}`] = marker;
          
          // Debug log for verification
          debugLog(`Added marker for ${item.type}: ${item.label || item.id} at [${item.coordinates}]`);
        });
      }
    }
  }, [selectedHotspot, selectedEvent, mapItems, mapLoaded]);

  // Separate effect for overview markers when nothing is selected
  useEffect(() => {
    if (!map.current || !mapLoaded || selectedHotspot || selectedEvent || !hotspots || !events) {
      return;
    }

    debugLog("Updating overview markers");
    
    // Remove all existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Show all hotspots and events as unselected markers
    const sortedHotspots = [...hotspots].sort((a, b) => a.id.localeCompare(b.id));
    const sortedEvents = [...events].sort((a, b) => a.id.localeCompare(b.id));

    sortedHotspots.forEach((hotspot) => {
      const markerElement = document.createElement("div");
      const trafficClass = hotspot.trafficLevel || "medium";
      markerElement.className = `hotspot-card ${trafficClass} map-hotspot-marker`;
      markerElement.textContent = hotspot.label;

      // Create popup for hover effect
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 15,
        className: 'marker-tooltip'
      }).setText(hotspot.name || `${hotspot.label} Zone`);

      markerElement.addEventListener("mouseenter", () => {
        popup.addTo(map.current!);
      });

      markerElement.addEventListener("mouseleave", () => {
        popup.remove();
      });

      markerElement.addEventListener("click", () => {
        debugLog(`Hotspot marker clicked: ${hotspot.id}`);
        setSelectedHotspot(hotspot);
      });

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: "center",
      })
        .setLngLat(hotspot.coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current[`hotspot-${hotspot.id}`] = marker;
    });

    sortedEvents.forEach((event) => {
      const eventId = event.id || event.event_id;
      const eventLabel = 'label' in event ? event.label : '';
      const eventName = event.name || event.event_name || '';
      const eventCoordinates = event.coordinates;
      // Always use the same base class, add 'highlighted' if selected
      const markerElement = document.createElement("div");
      markerElement.className = "event-marker" + (selectedEvent && (selectedEvent.id || selectedEvent.event_id) === eventId ? " highlighted" : "");
      markerElement.textContent = eventLabel;

      // Create popup for hover effect
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: [0, -30],
        className: 'marker-tooltip',
        anchor: 'bottom'
      }).setText(event.event_name || event.name || '');

      markerElement.addEventListener("mouseenter", () => {
        popup.addTo(map.current!);
      });

      markerElement.addEventListener("mouseleave", () => {
        popup.remove();
      });

      markerElement.addEventListener("click", () => {
        debugLog(`Event marker clicked: ${eventId}`);
        setSelectedEvent(event);
      });

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: "center",
        offset: [0, -12], // Custom offset for visual centering
      })
        .setLngLat(eventCoordinates)
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current[`event-${eventId}`] = marker;
    });
  }, [hotspots, events, mapLoaded, selectedHotspot, selectedEvent, markerRefreshTrigger]);

  // Helper function to get map item icon
  const getMapItemIcon = (type: string) => {
    switch (type) {
      case "bus":
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus">
            <path d="M19 17h2l.64-2.54c.24-.959.24-1.962 0-2.92l-1.07-4.27A3 3 0 0 0 17.66 5H4a2 2 0 0 0-2 2v10h2"></path>
            <path d="M14 17H9"></path>
            <circle cx="6.5" cy="17.5" r="2.5"></circle>
            <circle cx="16.5" cy="17.5" r="2.5"></circle>
          </svg>
        `;
      case "tram":
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-train">
            <rect x="4" y="3" width="16" height="16" rx="2"></rect>
            <path d="M4 11h16"></path>
            <path d="M12 3v8"></path>
            <path d="m8 19-2 3"></path>
            <path d="m18 22-2-3"></path>
            <path d="M8 15h0"></path>
            <path d="M16 15h0"></path>
          </svg>
        `;
      case "business":
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path>
            <path d="M2 7h20"></path>
            <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"></path>
          </svg>
        `;
      case "parking":
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-parking">
            <rect width="18" height="18" x="3" y="3" rx="2"></rect>
            <path d="M9 17V7h4a3 3 0 0 1 0 6H9"></path>
          </svg>
        `;
      case "available":
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-dot">
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
      case "business": return "text-orange-600";
      case "parking": return "text-blue-800";
      case "available": return "text-green-600";
      default: return "";
    }
  };

  const showDetails = selectedEvent !== null || selectedHotspot !== null;
  const showComparison = (isHotspotCompareMode && selectedHotspotsForComparison.length > 0) || 
                         (isEventCompareMode && selectedEventsForComparison.length > 0);

  // Add ref to track container size changes
  const prevShowDetails = useRef(showDetails);
  const prevIsExpanded = useRef(isAnyCardExpanded);
  const prevShowComparison = useRef(showComparison);
  
  // Listen for container size changes and resize map correctly
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Only trigger resize when container size actually changes
    if (prevShowDetails.current !== showDetails || 
        prevIsExpanded.current !== isAnyCardExpanded ||
        prevShowComparison.current !== showComparison) {
      
      debugLog("Container size changed, triggering map resize");
      
      requestAnimationFrame(() => {
        if (!map.current) return;
        
        setTimeout(() => {
          if (!map.current) return;
          map.current.resize();
          debugLog("Map resize() called");
        }, 300);
      });
      
      // Update refs for next comparison
      prevShowDetails.current = showDetails;
      prevIsExpanded.current = isAnyCardExpanded;
      prevShowComparison.current = showComparison;
    }
  }, [showDetails, isAnyCardExpanded, showComparison, mapLoaded]);

  // Log when selection changes
  useEffect(() => {
    if (selectedHotspot) {
      debugLog("Selection changed to hotspot", { 
        id: selectedHotspot.id, 
        coordinates: selectedHotspot.coordinates 
      });
      // Reset manual toggle tracking when a new selection is made
      pulseManuallyToggled.current = false;
    } else if (selectedEvent) {
      debugLog("Selection changed to event", { 
        id: selectedEvent.id, 
        coordinates: selectedEvent.coordinates 
      });
      // Reset manual toggle tracking when a new selection is made
      pulseManuallyToggled.current = false;
    } else {
      debugLog("Selection cleared");
    }
  }, [selectedHotspot, selectedEvent]);
  
  // Log when showDetails changes (layout resize trigger)
  useEffect(() => {
    debugLog("Layout resize", { 
      showDetails, 
      isAnyCardExpanded 
    });
  }, [showDetails, isAnyCardExpanded]);

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
          mapLoaded: mapLoaded,
        });
      }
    };

    window.addEventListener("resize", checkDimensions);
    return () => window.removeEventListener("resize", checkDimensions);
  }, [mapLoaded]);

  // Debug effect to show warning if container dimensions are too small
  useEffect(() => {
    if (!mapContainer.current) return;

    const checkDimensions = () => {
      const width = mapContainer.current?.offsetWidth || 0;
      const height = mapContainer.current?.offsetHeight || 0;

      if (width < 100 || height < 100) {
        debugLog("WARNING: Map container dimensions are too small", {
          width,
          height,
        });
      }
    };

    checkDimensions();
    window.addEventListener("resize", checkDimensions);

    return () => window.removeEventListener("resize", checkDimensions);
  }, []);

  // Add this effect to trigger a refresh when deselection happens
  useEffect(() => {
    // When both are null (deselected), trigger a refresh
    if (selectedHotspot === null && selectedEvent === null) {
      // Increment to create a new value and trigger effect
      setMarkerRefreshTrigger(prev => prev + 1);
    }
  }, [selectedHotspot, selectedEvent]);

  // Control pulse/traffic lines visibility based on selection state
  useEffect(() => {
    // If manually toggled, don't override user preference
    if (pulseManuallyToggled.current) {
      return;
    }
    
    // Turn on when a card is selected
    if (selectedHotspot || selectedEvent) {
      setPulse(true);
    } 
    // Turn off when deselected
    else {
      setPulse(false);
    }
  }, [selectedHotspot, selectedEvent, setPulse]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainer} 
        className="absolute inset-0"
      />
      
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-20">
          <div className="text-red-500 text-center p-4">
            <p className="font-bold">Error</p>
            <p>{mapError}</p>
          </div>
        </div>
      )}

      {/* Uncomment PulseToggle to restore functionality */}
      <div className="absolute top-4 left-4 z-10">
        <PulseToggle value={pulse} onChange={(newValue) => {
          // Mark that the pulse was manually toggled
          pulseManuallyToggled.current = true;
          setPulse(newValue);
        }} />
      </div>
      
      {/* Show the legend only when a hotspot or event is selected */}
      {showDetails && (
        <div className="absolute left-4 top-1/3 z-10 transform -translate-y-1/2">
          <MobileBusinessLegend />
        </div>
      )}
      
      {/* ComparisonView will handle its own visibility */}
      <ComparisonView />
      
      {/* Show location metrics if there's a selection and not in comparison mode */}
      {showDetails && !showComparison && (
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <LocationMetrics onAnyCardExpanded={setIsAnyCardExpanded} />
        </div>
      )}
    </div>
  );
};