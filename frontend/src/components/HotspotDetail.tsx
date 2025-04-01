import React, { useEffect, useState } from "react";
import { Hotspot } from "@/lib/types";
import { Cloud, Footprints, MapPin, BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import { HotspotMarker } from "./HotspotMarker";
import { fetchSimilarHotspots } from "@/lib/api";
import { FootTrafficChart } from "./FootTrafficChart";
import { Button } from "@/components/ui/button";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { useTampere } from "@/lib/TampereContext";

interface HotspotDetailProps {
  hotspot: Hotspot;
  onHotspotClick: (hotspot: Hotspot) => void;
}

export const HotspotDetail: React.FC<HotspotDetailProps> = ({ hotspot, onHotspotClick }) => {
  const [similarHotspots, setSimilarHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [footTrafficData, setFootTrafficData] = useState<any[]>([]);
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(false);
  const { loadHotspotFootTraffic } = useTampere();

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

  // Load foot traffic data when component mounts or hotspot changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingTraffic(true);
      try {
        const data = await loadHotspotFootTraffic(hotspot.id);
        setFootTrafficData(data);
      } catch (error) {
        console.error("Error loading foot traffic data:", error);
        setFootTrafficData([]);
      } finally {
        setIsLoadingTraffic(false);
      }
    };

    fetchData();
  }, [hotspot.id, loadHotspotFootTraffic]);

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
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="bg-gray-50 rounded-lg border border-gray-200"
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="hotspot-marker mr-3 !h-8 !w-8 !text-base !flex !items-center !justify-center">
              {hotspot.label}
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-bold flex items-center">
                Zone {hotspot.label}
                <span className="ml-2 text-sm text-tampere-red font-normal">
                  {getTrafficLevelText(hotspot.trafficLevel.toLowerCase())}
                </span>
              </h3>
              <p className="text-sm flex items-center mt-2">
                <MapPin size={16} className="mr-1 text-gray-500" />
                {hotspot.address}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
                <div className="text-sm flex items-center">
                  <Footprints size={14} className="mr-1 text-gray-500" />
                  <span>{getTrafficLevelText(hotspot.trafficLevel.toLowerCase())}</span>
                </div>
                <div className="text-sm flex items-center">
                  <Cloud size={14} className="mr-1 text-gray-500" />
                  <span>{getWeatherText(hotspot.weather.toLowerCase())}</span>
                </div>
              </div>
            </div>
          </div>
          
          {footTrafficData.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <div className="flex items-center text-sm text-gray-600">
                <BarChart2 size={14} className="mr-1.5" />
                Foot Traffic Data
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle foot traffic chart</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          )}
        </div>
        
        {footTrafficData.length > 0 && (
          <CollapsibleContent>
            <div className="px-4 pb-4">
              <div className="text-xs text-gray-500 mb-1 flex justify-between">
                <span>Foot Traffic</span>
                <span className="text-tampere-red">Live + Forecast</span>
              </div>
              {isLoadingTraffic ? (
                <div className="h-24 flex items-center justify-center text-gray-400 text-sm">
                  Loading chart data...
                </div>
              ) : (
                <FootTrafficChart data={footTrafficData} />
              )}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>

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