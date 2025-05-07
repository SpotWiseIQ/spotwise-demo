import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useStaticBusiness } from "@/lib/StaticBusinessContext";
import { sampleZones } from "./StaticBusinessSidebar";
import { StaticLocationMetrics } from "./StaticLocationMetrics";
import { StaticBusinessLegend } from "./StaticBusinessLegend";

// Interface for POI data
interface POI {
  poi_id: string;
  name: string;
  location_id: string;
  latitude: number;
  longitude: number;
  category: string;
  description?: string;
}

// Add debugging utilities
const DEBUG_PREFIX = "🔍 MAP DEBUG";
const debugLog = (message: string, data?: any) => {
  if (data) {
    console.log(`${DEBUG_PREFIX}: ${message}`, data);
  } else {
    console.log(`${DEBUG_PREFIX}: ${message}`);
  }
};

const debugError = (message: string, error?: any) => {
  console.error(`❌ MAP ERROR: ${message}`, error || '');
};

const debugGroup = (title: string, fn: () => void) => {
  console.group(`${DEBUG_PREFIX}: ${title}`);
  try {
    fn();
  } finally {
    console.groupEnd();
  }
};

const timeOperation = async <T,>(name: string, operation: () => Promise<T>): Promise<T> => {
  const startTime = performance.now();
  try {
    const result = await operation();
    const duration = Math.round(performance.now() - startTime);
    debugLog(`${name} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    debugError(`${name} failed after ${duration}ms`, error);
    throw error;
  }
};

// Helper function to parse CSV data
const parseCSV = (csvText: string): POI[] => {
  if (!csvText || csvText.trim() === '') {
    debugError("Empty CSV text provided");
    return [];
  }

  try {
    debugLog("Starting CSV parsing");
    const startTime = performance.now();
    
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) {
      debugError("CSV has no data rows");
      return [];
    }

    const headers = lines[0].split(';');
    debugLog(`CSV has ${lines.length-1} data rows with ${headers.length} columns`);
    
    const results = lines.slice(1).map((line, index) => {
      try {
        const values = line.split(';');
        
        // Check if we have enough values
        if (values.length < 6) {
          debugError(`Line ${index + 2} has insufficient data (${values.length} columns): ${line}`);
          return null;
        }
        
        // Trim whitespace from all values, especially coordinates
        const latitude = parseFloat(values[3].trim());
        const longitude = parseFloat(values[4].trim());
        
        if (isNaN(latitude) || isNaN(longitude)) {
          debugError(`Line ${index + 2} has invalid coordinates: lat=${values[3]}, lng=${values[4]}`);
        }
        
        return {
          poi_id: values[0].trim(),
          name: values[1].trim(),
          location_id: values[2].trim(),
          latitude: latitude,
          longitude: longitude,
          category: values[5].trim(),
          description: values.length > 6 && values[6] ? values[6].trim() : ''
        };
      } catch (error) {
        debugError(`Error parsing CSV line ${index + 2}:`, error);
        return null;
      }
    }).filter(poi => poi !== null) as POI[];
    
    const duration = Math.round(performance.now() - startTime);
    debugLog(`CSV parsing completed in ${duration}ms with ${results.length} valid POIs`);
    
    return results;
  } catch (error) {
    debugError("Error parsing CSV", error);
    return [];
  }
};

// Helper function to determine if a POI is a car wash
const isCarWash = (poi: POI): boolean => {
  // Case-insensitive check for category
  if (poi.category && poi.category.toLowerCase().includes('wash')) {
    return true;
  }
  
  // Check for car wash in name or description
  const searchTerms = ['car wash', 'carwash', 'autopesu', 'pesu'];
  const searchText = `${poi.name || ''} ${poi.description || ''}`.toLowerCase();
  
  return searchTerms.some(term => searchText.includes(term));
};

// Helper function to get map item icon (reused from MobileBusinessMap)
const getMapItemIcon = (type: string) => {
  const icons = {
    "Car Wash": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>`,
    "Bus Stop": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2l.64-2.54c.24-.959.24-1.962 0-2.92l-1.07-4.27A3 3 0 0 0 17.66 5H4a2 2 0 0 0-2 2v10h2"></path><path d="M14 17H9"></path><circle cx="6.5" cy="17.5" r="2.5"></circle><circle cx="16.5" cy="17.5" r="2.5"></circle></svg>`,
    "Tram Stop": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path><path d="m8 19-2 3"></path><path d="m18 22-2-3"></path><path d="M8 15h0"></path><path d="M16 15h0"></path></svg>`,
    "Shopping": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 11 4-7"></path><path d="m19 11-4-7"></path><path d="M2 11h20"></path><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8c.9 0 1.8-.7 2-1.6l1.7-7.4"></path><path d="m9 11 1 9"></path><path d="M4.5 15.5h15"></path><path d="m15 11-1 9"></path></svg>`,
    "Parking": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M9 17V7h4a3 3 0 0 1 0 6H9"></path></svg>`,
    "Food": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" x2="6" y1="2" y2="4"></line><line x1="10" x2="10" y1="2" y2="4"></line><line x1="14" x2="14" y1="2" y2="4"></line></svg>`,
    "Park": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"></path><path d="M7 16v6"></path><path d="M13 19v3"></path><path d="M12 13v.2a3 3 0 0 0 1.1 5.8H17v0h0a3 3 0 0 0 1-5.8V13a3 3 0 0 0-6 0Z"></path></svg>`,
    "Gas Station": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V12a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v10"></path><path d="M14 22V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v16"></path><path d="M5 12V2"></path><path d="M16 6V2"></path></svg>`,
    "Education": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    "Others": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"></line><line x1="6" x2="6" y1="18" y2="11"></line><line x1="10" x2="10" y1="18" y2="11"></line><line x1="14" x2="14" y1="18" y2="11"></line><line x1="18" x2="18" y1="18" y2="11"></line><polygon points="12 2 20 7 4 7"></polygon></svg>`
  };
  
  return icons[type as keyof typeof icons] || icons["Others"];
};

// Helper function to get map item color
const getMapItemColor = (type: string) => {
  const colors = {
    "Car Wash": "text-blue-500",
    "Bus Stop": "text-blue-600",
    "Tram Stop": "text-purple-700",
    "Shopping": "text-orange-600",
    "Parking": "text-blue-800",
    "Food": "text-amber-600",
    "Park": "text-green-700",
    "Gas Station": "text-red-600",
    "Education": "text-indigo-600",
    "Others": "text-gray-600"
  };
  
  return colors[type as keyof typeof colors] || colors["Others"];
};

export const StaticBusinessMap: React.FC = () => {
  const { selectedZone } = useStaticBusiness();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [isAnyCardExpanded, setIsAnyCardExpanded] = useState(false);

  // Load POI data when zone changes
  useEffect(() => {
    const loadPOIData = async () => {
      if (!selectedZone) {
        setPois([]);
        debugLog("No zone selected, cleared POIs");
        return null;
      }

      debugGroup(`Loading POIs for zone: ${selectedZone.name}`, () => {
        debugLog(`Zone details`, { 
          id: selectedZone.id,
          name: selectedZone.name, 
          coordinates: selectedZone.coordinates
        });
      });
      
      // Format the zone name to match the CSV file naming, handle spaces and special characters
      const zoneFileName = `LOC_${selectedZone.name}_poi.csv`;
      const encodedFileName = encodeURIComponent(zoneFileName);
      
      // Function to check if content looks like a CSV
      const isCSVContent = (text: string): boolean => {
        const firstLine = text.trim().split('\n')[0];
        // Check if first line contains typical CSV headers with semicolons
        const isCSVHeader = firstLine.includes(';') && 
                            (firstLine.includes('poi_id') || 
                             firstLine.includes('name') || 
                             firstLine.includes('latitude'));
        
        if (!isCSVHeader) {
          debugError(`Response does not appear to be CSV data. First line: "${firstLine}"`);
          // Check for HTML content
          if (text.includes('<html') || text.includes('<!DOCTYPE')) {
            debugError('Received HTML content instead of CSV data');
          }
        }
        
        return isCSVHeader;
      };
      
      return await timeOperation(`Fetch ${zoneFileName}`, async () => {
        try {
          // List of paths to try in order
          const pathsToTry = [
            `/mock_data/static_poi/${encodedFileName}`,
            `/mock_data/static_poi/${zoneFileName}`,
            `/backend/mock_data/static_poi/${encodedFileName}`,
            `/backend/mock_data/static_poi/${zoneFileName}`,
            `/mock_data/static_poi/LOC_${encodeURIComponent(selectedZone.name.replace(/\s+/g, '_'))}_poi.csv`,
            `/backend/mock_data/static_poi/LOC_${encodeURIComponent(selectedZone.name.replace(/\s+/g, '_'))}_poi.csv`
          ];
          
          let csvText = null;
          
          // Try each path in sequence until we find a valid CSV
          for (const path of pathsToTry) {
            debugLog(`Trying path: ${path}`);
            try {
              const response = await fetch(path);
              
              if (!response.ok) {
                debugLog(`Path failed with status ${response.status}: ${path}`);
                continue;
              }
              
              const text = await response.text();
              
              // Quick check to see if the content actually looks like a CSV
              if (!isCSVContent(text)) {
                debugLog(`Path returned non-CSV content: ${path}`);
                continue;
              }
              
              debugLog(`CSV loaded successfully from: ${path}`);
              debugLog(`Data size: ${text.length} bytes, ${text.split('\n').length} lines`);
              csvText = text;
              break;
            } catch (error) {
              debugLog(`Error fetching from ${path}:`, error);
            }
          }
          
          if (csvText) {
            return csvText;
          }
          
          // If we got here, we failed to find a valid CSV
          throw new Error(`Failed to load POI data for ${selectedZone.name} after trying ${pathsToTry.length} paths`);
        } catch (error) {
          debugError("Error loading POI data", error);
          
          // Use hardcoded fallback data for the specific zone
          if (selectedZone.name === "Ratina Mall Area") {
            debugLog("Using fallback data for Ratina Mall Area");
            return `poi_id;name;location_id;latitude;longitude;category;description
POI001;Shopping Center Ratina;LOC_ratina_mall_area;61.4933;23.7671;Shopping;
POI002;Koskikeskus;LOC_ratina_mall_area;61.4959;23.7673;Shopping;
POI003;Tampereen stadion;LOC_ratina_mall_area;61.4929;23.7642;Sport;
POI004;Pysäköintialue;LOC_ratina_mall_area;61.4936;23.7631;Parking;
POI005;Ratinannokanpuisto;LOC_ratina_mall_area;61.4925;23.7604;Park;
POI006;Finnpark Voimakadun parkki;LOC_ratina_mall_area;61.4912;23.7674;Parking;
POI007;P-Ratina;LOC_ratina_mall_area;61.4924;23.7681;Parking;
POI008;Finnpark Koskikeskus;LOC_ratina_mall_area;61.4951;23.7682;Parking;
POI009;Nokia Arena;LOC_ratina_mall_area;61.4938;23.7747;Sport;
POI010;Ratinanranta Bus Stop;LOC_ratina_mall_area;61.4920;23.7635;Bus Stop;
POI011;Linja-autoasema;LOC_ratina_mall_area;61.4939;23.7708;Bus Stop;
POI012;Tampere Adult Education Center TAKK;LOC_ratina_mall_area;61.4917;23.7745;Education;
POI013;Sorin aukio Tram Stop;LOC_ratina_mall_area;61.4950;23.7698;Tram Stop;
POI014;Tampereen valtatie;LOC_ratina_mall_area;61.4916;23.7721;Bus Stop;
POI015;Neste Tampere Hatanpää;LOC_ratina_mall_area;61.4925;23.7729;Gas Station;
POI016;Viinikanlahti Bus Stop;LOC_ratina_mall_area;61.4897;23.7718;Bus Stop;
POI017;Aimo Park | Areena;LOC_ratina_mall_area;61.4934;23.7730;Parking;
POI018;ABC Viinikka Tampere;LOC_ratina_mall_area;61.4858;23.7770;Gas Station;
POI019;Autopesu tampere - autopesula;LOC_ratina_mall_area;61.4924;23.7668;Car Wash;
POI020;Ratinan Autopesu;LOC_ratina_mall_area;61.4935;23.7700;Car Wash;
POI021;Carspot Autopesu;LOC_ratina_mall_area;61.4958;23.7699;Car Wash;
POI022;Frenckellin autopesu;LOC_ratina_mall_area;61.5000;23.7639;Car Wash;
POI023;ABC Carwash Viinikka Tampere;LOC_ratina_mall_area;61.4865;23.7787;Car Wash;`;
          }
          
          return null;
        }
      });
    };

    const processCSVData = async () => {
      const csvText = await loadPOIData();
      if (!csvText) {
        setPois([]);
        return;
      }
      
      await timeOperation("Process CSV data", async () => {
        try {
          const parsedPois = parseCSV(csvText);
          
          // Log some info about the parsed POIs
          debugGroup(`Parsed ${parsedPois.length} POIs`, () => {
            if (parsedPois.length > 0) {
              debugLog(`Sample POIs:`, parsedPois.slice(0, 2));
            }
            
            // Count by category
            const categories = parsedPois.reduce((acc, poi) => {
              acc[poi.category] = (acc[poi.category] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            debugLog(`POIs by category:`, categories);
          });
          
          // Process POIs to prioritize car washes and limit bus stops
          const processedPois = processPoisForDisplay(parsedPois);
          
          const carWashes = processedPois.filter(p => isCarWash(p));
          debugLog(`Found ${carWashes.length} car washes:`, carWashes.map(cw => cw.name));
          
          debugLog(`Processing complete. Displaying ${processedPois.length} of ${parsedPois.length} POIs`);
          setPois(processedPois);
        } catch (error) {
          debugError("Error processing POI data", error);
          setPois([]);
        }
      });
    };

    processCSVData();
  }, [selectedZone]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const defaultCenter: [number, number] = [23.7609, 61.4978]; // Tampere center

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: "https://tiles.openfreemap.org/styles/positron",
        center: defaultCenter,
        zoom: 11,
      });

      map.current.on("load", () => {
        setMapLoaded(true);
        map.current?.addControl(
          new maplibregl.NavigationControl(),
          "top-right"
        );
        
        // Add markers for all zones
        sampleZones.forEach(zone => {
          const zoneMarkerElement = document.createElement("div");
          zoneMarkerElement.className = "zone-marker";
          
          // Create pin-shaped marker with SVG
          zoneMarkerElement.innerHTML = `
            <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12C0 20.25 12 36 12 36C12 36 24 20.25 24 12C24 5.37 18.63 0 12 0Z" fill="#DC2626"/>
              <circle cx="12" cy="12" r="5" fill="white"/>
            </svg>
          `;
          
          const marker = new maplibregl.Marker({
            element: zoneMarkerElement,
            anchor: "bottom", // Changed to bottom for pin marker
          })
            .setLngLat(zone.coordinates)
            .addTo(map.current!);
          
          // Add to markersRef with special 'zone_' prefix to avoid collision
          markersRef.current[`zone_${zone.id}`] = marker;
          
          // Add popup with zone name on hover
          const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: [0, -36], // Adjusted offset for pin height
            className: 'zone-tooltip',
          }).setText(zone.name);
          
          zoneMarkerElement.addEventListener("mouseenter", () => {
            popup.addTo(map.current!);
            marker.setPopup(popup);
          });
          
          zoneMarkerElement.addEventListener("mouseleave", () => {
            popup.remove();
          });
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

  // Update markers when selected zone or POIs change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Remove existing POI markers but keep zone markers
    Object.entries(markersRef.current).forEach(([key, marker]) => {
      // Only remove markers that aren't zone markers
      if (!key.startsWith('zone_')) {
        marker.remove();
        delete markersRef.current[key];
      }
    });

    if (selectedZone) {
      // Update selected zone marker style
      Object.entries(markersRef.current).forEach(([key, marker]) => {
        const el = marker.getElement();
        
        if (key === `zone_${selectedZone.id}`) {
          // Selected zone: smaller size, brighter red
          el.innerHTML = `
            <svg width="18" height="27" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12C0 20.25 12 36 12 36C12 36 24 20.25 24 12C24 5.37 18.63 0 12 0Z" fill="#FF0000"/>
              <circle cx="12" cy="12" r="5" fill="white"/>
            </svg>
          `;
          el.style.zIndex = "10";
        } else if (key.startsWith('zone_')) {
          // Non-selected zones: standard size, regular red
          el.innerHTML = `
            <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12C0 20.25 12 36 12 36C12 36 24 20.25 24 12C24 5.37 18.63 0 12 0Z" fill="#DC2626"/>
              <circle cx="12" cy="12" r="5" fill="white"/>
            </svg>
          `;
          el.style.zIndex = "5";
        }
      });

      // Add POI markers
      pois.forEach((poi) => {
        // Skip POIs with invalid coordinates
        if (isNaN(poi.longitude) || isNaN(poi.latitude)) {
          console.warn(`Skipping POI with invalid coordinates: ${poi.name}`);
          return;
        }
        
        const markerElement = document.createElement("div");
        // Check if POI is a car wash and override its category if it is
        const effectiveCategory = isCarWash(poi) ? "Car Wash" : poi.category;
        
        // Add special class for Car Wash markers to emphasize them
        const isCarWashMarker = effectiveCategory === "Car Wash";
        markerElement.className = `map-icon-container ${getMapItemColor(effectiveCategory)} ${isCarWashMarker ? 'car-wash-marker' : ''}`;
        markerElement.innerHTML = getMapItemIcon(effectiveCategory);

        // Create popup for hover effect
        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: [0, -30],
          className: 'marker-tooltip',
          anchor: 'bottom'
        }).setText(poi.name);

        markerElement.addEventListener("mouseenter", () => {
          popup.addTo(map.current!);
        });

        markerElement.addEventListener("mouseleave", () => {
          popup.remove();
        });

        try {
          const marker = new maplibregl.Marker({
            element: markerElement,
            anchor: "center",
          })
            .setLngLat([poi.longitude, poi.latitude])
            .setPopup(popup)
            .addTo(map.current!);

          markersRef.current[poi.poi_id] = marker;
        } catch (error) {
          console.error(`Error creating marker for POI ${poi.name}:`, error);
        }
      });

      // Fly to selected zone
      map.current.flyTo({
        center: selectedZone.coordinates,
        zoom: 14,
        essential: true,
        duration: 1500,
      });
    } else {
      // Reset view to Tampere center when no zone is selected
      map.current.flyTo({
        center: [23.7609, 61.4978] as [number, number],
        zoom: 11,
        essential: true,
        duration: 1500,
      });
    }
  }, [selectedZone, pois, mapLoaded]);

  // Helper function to process POIs for display
  const processPoisForDisplay = (pois: POI[]): POI[] => {
    // First, identify all car washes (including those at the end of the CSV)
    const carWashes = pois.filter(poi => isCarWash(poi));
    
    // Calculate how many non-car wash POIs we can include
    const remainingSlots = Math.max(0, 10 - carWashes.length);
    
    // Get other non-bus stop POIs
    const otherPois = pois
      .filter(poi => !isCarWash(poi) && poi.category !== "Bus Stop")
      .slice(0, Math.max(0, remainingSlots - 2)); // Reserve at most 2 spots for bus stops
    
    // Get a limited number of bus stops if we still have room
    const busStopsCount = Math.min(2, remainingSlots - otherPois.length);
    const busStops = pois
      .filter(poi => poi.category === "Bus Stop")
      .slice(0, busStopsCount);
    
    // Combine with car washes first for priority, ensuring total is max 10
    const result = [...carWashes, ...otherPois, ...busStops];
    
    // Log the breakdown
    debugLog(`Displaying ${result.length} POIs: ${carWashes.length} car washes, ${otherPois.length} other POIs, ${busStops.length} bus stops`);
    
    return result.slice(0, 10);
  };

  return (
    <div className="relative w-full h-full">
      <style>
        {`
          .car-wash-marker {
            background-color: rgba(219, 234, 254, 0.9); /* bg-blue-100 with opacity */
            border: 2px solid #93c5fd; /* border-blue-300 */
            border-radius: 50%;
            padding: 3px;
            box-shadow: 0 0 0 2px rgba(147, 197, 253, 0.5);
          }
        `}
      </style>
      <div ref={mapContainer} className="absolute inset-0" />
      
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-20">
          <div className="text-red-500 text-center p-4">
            <p className="font-bold">Error</p>
            <p>{mapError}</p>
          </div>
        </div>
      )}

      {/* Legend - positioned in the left-center of visible map area */}
      {selectedZone && (
        <div className={`absolute left-4 z-10 transition-all duration-300 ${
          isAnyCardExpanded 
            ? 'top-[35%] -translate-y-1/2' 
            : 'top-[40%] -translate-y-1/2'
        }`}>
          <StaticBusinessLegend />
        </div>
      )}

      {/* Zone status indicator - only show when a zone is selected */}
      {selectedZone && (
        <div className="absolute top-4 left-4 bg-white p-2 rounded-md shadow-md z-10">
          <p className="text-sm font-medium">Viewing: {selectedZone.name}</p>
        </div>
      )}

      {/* Metrics section - shown when a zone is selected */}
      {selectedZone && (
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <StaticLocationMetrics onAnyCardExpanded={setIsAnyCardExpanded} />
        </div>
      )}
    </div>
  );
}; 