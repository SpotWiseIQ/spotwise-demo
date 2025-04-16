import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { fetchTampereCenter } from "@/lib/api";
import { Zone } from "./ZoneCard";
import { sampleZones } from "./StaticBusinessSidebar";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`%c🗺️ STATIC MAP DEBUG: ${message}`, 'background: #f0f0f0; color: #0066cc; font-weight: bold; padding: 2px 5px; border-radius: 3px;', data || '');
};

interface StaticBusinessMapProps {
  businessLocations?: any[];
  selectedZone?: Zone | null;
}

// Define proper GeoJSON types
interface ZoneProperties {
  id: string;
  name: string;
  carFlow: number;
  footTraffic: number;
  avgParkingTime: number;
  selected: boolean;
}

interface ZoneFeature extends GeoJSON.Feature {
  properties: ZoneProperties;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

interface ZonesGeoJSON extends GeoJSON.FeatureCollection {
  features: ZoneFeature[];
}

export const StaticBusinessMap: React.FC<StaticBusinessMapProps> = ({ 
  selectedZone = null
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [tampereCenter, setTampereCenter] = useState<[number, number]>([23.761, 61.4978]); // Default center

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

  // Initialize map
  useEffect(() => {
    debugLog("Map initialization effect triggered");
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: "https://tiles.openfreemap.org/styles/positron",
        center: tampereCenter,
        zoom: 11,
      });

      map.current.on("load", () => {
        setMapLoaded(true);
        map.current?.addControl(new maplibregl.NavigationControl(), "top-right");
        debugLog("Map loaded successfully");
      });

      map.current.on("error", (e) => {
        console.error("Map error:", e);
        debugLog("Map ERROR event fired", e);
        setMapError("Failed to load the map. Please try again later.");
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

  // Add zones as a GeoJSON source
  useEffect(() => {
    if (!map.current || !mapLoaded) {
      debugLog("Map not ready for zones layer");
      return;
    }

    // Convert zones to GeoJSON format
    const zonesGeoJSON: ZonesGeoJSON = {
      type: "FeatureCollection",
      features: sampleZones.map(zone => ({
        type: "Feature",
        properties: {
          id: zone.id,
          name: zone.name,
          carFlow: zone.carFlow,
          footTraffic: zone.footTraffic,
          avgParkingTime: zone.avgParkingTime,
          selected: selectedZone?.id === zone.id
        },
        geometry: {
          type: "Point",
          coordinates: [
            parseFloat(zone.coordinates[0].toString()),
            parseFloat(zone.coordinates[1].toString())
          ]
        }
      }))
    };

    debugLog("Adding GeoJSON source for zones", zonesGeoJSON);

    // Add source if it doesn't exist, update it if it does
    if (!map.current.getSource('zones')) {
      map.current.addSource('zones', {
        type: 'geojson',
        data: zonesGeoJSON
      });

      // Add a layer for the zone markers
      map.current.addLayer({
        id: 'zone-markers',
        type: 'symbol',
        source: 'zones',
        layout: {
          'icon-image': 'zone-icon',
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-anchor': 'bottom'
        }
      });

      // Create a custom icon for the zones
      const markerSvg = `
        <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.38 0 0 5.38 0 12C0 20.5 12 36 12 36C12 36 24 20.5 24 12C24 5.38 18.62 0 12 0Z" fill="#ea384c"/>
          <circle cx="12" cy="12" r="6" fill="white"/>
        </svg>
      `;

      // Create a custom marker image
      const createMarkerImage = () => {
        const img = new Image(24, 36);
        img.onload = () => {
          if (map.current && !map.current.hasImage('zone-icon')) {
            map.current.addImage('zone-icon', img);
          }
        };
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markerSvg)}`;
      };
      
      createMarkerImage();

      // Add a popup when hovering over the markers
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: [0, -10],
        className: 'marker-tooltip'
      });

      // Mouse events for marker layer
      map.current.on('mouseenter', 'zone-markers', (e) => {
        if (!e.features || !e.features[0]) return;
        
        map.current!.getCanvas().style.cursor = 'pointer';
        
        const feature = e.features[0];
        // Cast the feature to any to access coordinates safely
        const coordinates = (feature.geometry as any).coordinates.slice() as [number, number];
        const name = feature.properties.name;
        
        popup.setLngLat(coordinates)
          .setHTML(`<div>${name}</div>`)
          .addTo(map.current!);
      });

      map.current.on('mouseleave', 'zone-markers', () => {
        map.current!.getCanvas().style.cursor = '';
        popup.remove();
      });

      map.current.on('click', 'zone-markers', (e) => {
        if (!e.features || !e.features[0]) return;
        debugLog("Zone marker clicked", e.features[0].properties);
      });
    } else {
      // Update the existing source
      (map.current.getSource('zones') as maplibregl.GeoJSONSource).setData(zonesGeoJSON);
    }

    // If a zone is selected, fly to it
    if (selectedZone) {
      const lngLat: [number, number] = [
        parseFloat(selectedZone.coordinates[0].toString()),
        parseFloat(selectedZone.coordinates[1].toString())
      ];
      
      debugLog(`Flying to selected zone ${selectedZone.name} at coordinates:`, lngLat);
      
      map.current.flyTo({
        center: lngLat,
        zoom: 14,
        essential: true,
        duration: 1000
      });
    }
  }, [selectedZone, mapLoaded, sampleZones]);

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
      </div>
      
      {/* Zone status indicator - only show when a zone is selected */}
      {selectedZone && (
        <div className="absolute top-4 left-4 bg-white p-2 rounded-md shadow-md z-10">
          <p className="text-sm font-medium">Viewing: {selectedZone.name}</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .marker-tooltip {
          z-index: 10;
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 500;
        }
      `}} />
    </div>
  );
}; 