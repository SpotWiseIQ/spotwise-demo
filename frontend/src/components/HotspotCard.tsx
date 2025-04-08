import React, { useState, useEffect } from "react";
import { Hotspot } from "@/lib/types";
import {
  Cloud,
  Sun,
  Footprints,
  Wind,
  CloudRain,
  ChevronDown,
  ChevronUp,
  BarChart2,
  MapPin,
  Users,
} from "lucide-react";
import { FootTrafficChart } from "./FootTrafficChart";
import { useTampere } from "@/lib/TampereContext";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

type HotspotCardProps = {
  hotspot: Hotspot;
  onClick?: () => void;
  selected?: boolean;
};

export const HotspotCard: React.FC<HotspotCardProps> = ({
  hotspot,
  onClick,
  selected,
}) => {
  const { loadHotspotFootTraffic } = useTampere();
  const [footTrafficData, setFootTrafficData] = useState<any[]>([]);
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(false);
  const [isTrafficOpen, setIsTrafficOpen] = useState(false);

  useEffect(() => {
    // Always fetch foot traffic data regardless of selection
    const fetchData = async () => {
      setIsLoadingTraffic(true);
      try {
        // If footTraffic is already available in the hotspot object, use it
        if (hotspot.footTraffic) {
          setFootTrafficData(hotspot.footTraffic);
          setIsLoadingTraffic(false);
          return;
        }
        
        // Otherwise, load it via the context (which now prioritizes pre-loaded data)
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
  }, [hotspot.id, hotspot.footTraffic, loadHotspotFootTraffic]);

  // Reset traffic panel when deselected
  useEffect(() => {
    if (!selected) {
      setIsTrafficOpen(false);
    }
  }, [selected]);

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

  const getTrafficLevelText = (level: string) => {
    switch (level?.toLowerCase()) {
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
    switch (weather?.toLowerCase()) {
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

  const weatherInfo = getWeatherIcon(
    hotspot.weather?.toLowerCase() || "unknown"
  );
  const WeatherIcon = weatherInfo.icon;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-collapsible-trigger]")) {
      return;
    }
    if (onClick) {
      onClick();
    }
  };

  const handleChartToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTrafficOpen(!isTrafficOpen);
  };

  return (
    <div
      className={`flex flex-col my-1 bg-gray-50 rounded-lg border transition-all duration-200 ease-in-out ${
        selected
          ? "ring-2 ring-tampere-red border-tampere-red shadow-md"
          : "border-gray-200 hover:shadow-sm"
      }`}
    >
      <div
        className={`p-2 ${selected ? "pb-1" : "pb-0"} cursor-pointer`}
        onClick={handleCardClick}
      >
        <div className="flex items-center min-h-[40px]">
          <div
            className={`hotspot-card ${hotspot.trafficLevel?.toLowerCase()} !h-6 !w-6 !text-xs !flex !items-center !justify-center`}
          >
            {hotspot.label}
          </div>
          <div className="ml-3 flex-grow h-[20px] flex items-center overflow-hidden">
            <p
              className="text-sm font-medium truncate"
              title={hotspot.name}
            >{hotspot.name}</p>
          </div>
          <div className="flex flex-col min-w-[110px]">
            <div className="grid grid-cols-2 gap-x-5">
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 ${getTrafficColor(
                    hotspot.trafficLevel?.toLowerCase() || "unknown"
                  )} rounded-md flex items-center justify-center text-white`}
                >
                  <Footprints className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-0.5 text-gray-500 text-center w-10">
                  {hotspot.trafficLevel?.toLowerCase()}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 ${weatherInfo.color} rounded-md flex items-center justify-center text-white`}
                >
                  <WeatherIcon className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-0.5 text-gray-500 text-center w-10">
                  {weatherInfo.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <div className="border-t border-gray-200 mx-2 mt-1 mb-2 pt-3 px-1 space-y-4">
          <div>
            <h4 className="text-xs font-semibold mb-1.5 text-gray-600">
              Details
            </h4>
            <div className="space-y-1.5 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div className="flex items-center">
                  <Users
                    size={14}
                    className="mr-1.5 text-gray-500 flex-shrink-0"
                  />
                  <span className="text-gray-500 text-xs mr-1">
                    Population:
                  </span>
                  <span>{hotspot.population || "N/A"}</span>
                </div>
                <div className="flex items-center">
                  <MapPin
                    size={14}
                    className="mr-1.5 text-gray-500 flex-shrink-0"
                  />
                  <span className="text-gray-500 text-xs mr-1">Area Type:</span>
                  <span>{hotspot.areaType || "N/A"}</span>
                </div>
                <div className="flex items-center col-span-2">
                  <Users
                    size={14}
                    className="mr-1.5 text-gray-500 flex-shrink-0"
                  />
                  <span className="text-gray-500 text-xs mr-1">
                    Demographics:
                  </span>
                  <span>{hotspot.dominantDemographics || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Collapsible open={isTrafficOpen} onOpenChange={setIsTrafficOpen}>
        {isLoadingTraffic && (
          <div className="h-3 w-full flex items-center justify-center border-t mt-1.5 px-2 py-0.5">
            <div className="animate-pulse text-[9px] text-gray-400">
              Loading traffic...
            </div>
          </div>
        )}
        {!isLoadingTraffic && footTrafficData.length > 0 && (
          <CollapsibleTrigger
            asChild
            onClick={handleChartToggle}
            data-collapsible-trigger
          >
            <div className="flex items-center justify-between border-t mt-1.5 px-2 py-0.5 cursor-pointer hover:bg-gray-100 rounded-b-sm">
              <div className="flex items-center text-[9px] text-gray-500">
                <BarChart2 size={10} className="mr-1" />
                Foot Traffic
              </div>
              <div className="text-gray-400">
                {isTrafficOpen ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
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
    </div>
  );
};
