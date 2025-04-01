import React, { useState, useEffect } from "react";
import { Hotspot } from "@/lib/types";
import { Cloud, Sun, Footprints, Wind, CloudRain, ChevronDown, ChevronUp, BarChart2 } from "lucide-react";
import { FootTrafficChart } from "./FootTrafficChart";
import { useTampere } from "@/lib/TampereContext";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";

type HotspotMarkerProps = {
  hotspot: Hotspot;
  onClick?: () => void;
  selected?: boolean;
};

export const HotspotMarker: React.FC<HotspotMarkerProps> = ({
  hotspot,
  onClick,
  selected,
}) => {
  const { loadHotspotFootTraffic } = useTampere();
  const [footTrafficData, setFootTrafficData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load foot traffic data when component mounts or hotspot changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await loadHotspotFootTraffic(hotspot.id);
        setFootTrafficData(data);
      } catch (error) {
        console.error("Error loading foot traffic data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [hotspot.id, loadHotspotFootTraffic]);

  const getTrafficColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-orange-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case "sunny":
        return { icon: Sun, color: "bg-yellow-500", label: "sunny" };
      case "cloudy":
        return { icon: Cloud, color: "bg-gray-500", label: "cloudy" };
      case "windy":
        return { icon: Wind, color: "bg-blue-400", label: "windy" };
      case "rainy":
        return { icon: CloudRain, color: "bg-blue-600", label: "rainy" };
      default:
        return { icon: Cloud, color: "bg-gray-500", label: "unknown" };
    }
  };

  const weatherInfo = getWeatherIcon(hotspot.weather);
  const WeatherIcon = weatherInfo.icon;
  
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  const handleChartToggle = (e: React.MouseEvent) => {
    // Prevent the card click from firing
    e.stopPropagation();
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`flex flex-col my-1 bg-gray-50 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
        selected ? "ring-2 ring-tampere-red border-tampere-red" : "border-gray-200"
      }`}
    >
      <div
        className="p-2 pb-0"
        onClick={handleCardClick}
      >
        <div className="flex items-center min-h-[40px]">
          <div className={`hotspot-marker ${hotspot.trafficLevel} !h-6 !w-6 !text-xs !flex !items-center !justify-center`}>
            {hotspot.label}
          </div>
          <div className="ml-3 flex-grow h-[20px] flex items-center">
            <p className="text-sm font-medium truncate">{hotspot.address}</p>
          </div>
          <div className="flex flex-col min-w-[110px]">
            <div className="grid grid-cols-2 gap-x-5">
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 ${getTrafficColor(hotspot.trafficLevel)} rounded-md flex items-center justify-center text-white`}>
                  <Footprints className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-0.5 text-gray-500 text-center w-10">{hotspot.trafficLevel.toLowerCase()}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 ${weatherInfo.color} rounded-md flex items-center justify-center text-white`}>
                  <WeatherIcon className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-0.5 text-gray-500 text-center w-10">{weatherInfo.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {(!isLoading && footTrafficData.length > 0) && (
        <CollapsibleTrigger asChild onClick={handleChartToggle}>
          <div className="flex items-center justify-between border-t mt-1.5 px-2 py-0.5 cursor-pointer hover:bg-gray-100 rounded-b-sm">
            <div className="flex items-center text-[9px] text-gray-500">
              <BarChart2 size={10} className="mr-1" />
              Foot Traffic
            </div>
            <div className="text-gray-400">
              {isOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
      )}
      
      {isLoading && (
        <div className="h-3 w-full flex items-center justify-center border-t mt-1.5 px-2 py-0.5">
          <div className="animate-pulse text-[9px] text-gray-400">Loading...</div>
        </div>
      )}
            
      <CollapsibleContent>
        <div className="px-2 pt-1 pb-2">
          <div className="text-[10px] text-gray-500 mb-0.5 flex justify-end">
            <span className="text-tampere-red">Live + Forecast</span>
          </div>
          <FootTrafficChart data={footTrafficData} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
