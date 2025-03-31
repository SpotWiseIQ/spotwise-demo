import React, { useEffect, useState } from "react";
import { Hotspot } from "@/lib/types";
import { Cloud, Footprints, MapPin } from "lucide-react";
import { HotspotMarker } from "./HotspotMarker";
import { fetchSimilarHotspots } from "@/lib/api";

interface HotspotDetailProps {
  hotspot: Hotspot;
  onHotspotClick: (hotspot: Hotspot) => void;
}

export const HotspotDetail: React.FC<HotspotDetailProps> = ({ hotspot, onHotspotClick }) => {
  const [similarHotspots, setSimilarHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log(`🔍 HOTSPOT DETAIL: Fetching similar hotspots for hotspot id=${hotspot.id}, label=${hotspot.label}, address=${hotspot.address}`);
    
    const getSimilarHotspots = async () => {
      setLoading(true);
      try {
        const hotspots = await fetchSimilarHotspots(hotspot.id);
        console.log(`🔍 HOTSPOT DETAIL: Received ${hotspots.length} similar hotspots for hotspot id=${hotspot.id}`);
        hotspots.forEach((similarHotspot, index) => {
          console.log(`  Similar Hotspot ${index+1}: id=${similarHotspot.id}, label=${similarHotspot.label}, address=${similarHotspot.address}`);
        });
        setSimilarHotspots(hotspots);
      } catch (error) {
        console.error("Failed to fetch similar hotspots:", error);
        setSimilarHotspots([]);
      } finally {
        setLoading(false);
      }
    };

    getSimilarHotspots();
  }, [hotspot.id, hotspot.label, hotspot.address]);

  const handleSimilarHotspotClick = (similarHotspot: Hotspot) => {
    console.log(`🔍 HOTSPOT DETAIL: Similar hotspot clicked - id=${similarHotspot.id}, label=${similarHotspot.label}, address=${similarHotspot.address}`);
    onHotspotClick(similarHotspot);
  };

  const getTrafficLevelText = (level: string) => {
    switch (level) {
      case "high":
        return "High Traffic";
      case "medium":
        return "Medium Traffic";
      case "low":
        return "Low Traffic";
      default:
        return "Unknown Traffic";
    }
  };

  const getWeatherText = (weather: string) => {
    switch (weather) {
      case "sunny":
        return "Sunny";
      case "cloudy":
        return "Cloudy";
      case "windy":
        return "Windy";
      case "rainy":
        return "Rainy";
      default:
        return "Unknown Weather";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-start">
          <div className="hotspot-marker mr-3 !h-8 !w-8 !text-base !flex !items-center !justify-center">
            {hotspot.label}
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-bold flex items-center">
              Zone {hotspot.label}
              <span className="ml-2 text-sm text-tampere-red font-normal">
                {getTrafficLevelText(hotspot.dangerLevel.toLowerCase())}
              </span>
            </h3>
            <p className="text-sm flex items-center mt-2">
              <MapPin size={16} className="mr-1 text-gray-500" />
              {hotspot.address}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
              <div className="text-sm flex items-center">
                <Footprints size={14} className="mr-1 text-gray-500" />
                <span>{getTrafficLevelText(hotspot.dangerLevel.toLowerCase())}</span>
              </div>
              <div className="text-sm flex items-center">
                <Cloud size={14} className="mr-1 text-gray-500" />
                <span>{getWeatherText(hotspot.weather.toLowerCase())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-500">Loading similar zones...</div>
      ) : similarHotspots.length > 0 ? (
        <div>
          <h3 className="text-lg font-medium mb-3">Similar zones</h3>
          <div className="space-y-1.5">
            {similarHotspots.map(hotspot => (
              <HotspotMarker 
                key={hotspot.id} 
                hotspot={hotspot} 
                onClick={() => handleSimilarHotspotClick(hotspot)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}; 