import React, { useState, useEffect } from "react";
import { Hotspot } from "@/lib/types";
import { Cloud, Sun, Footprints, Wind, CloudRain } from "lucide-react";
import { FootTrafficChart } from "./FootTrafficChart";
import { useTampere } from "@/lib/TampereContext";

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

  return (
    <div
      className={`flex flex-col p-2 my-1.5 bg-gray-50 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
        selected ? "ring-2 ring-tampere-red border-tampere-red" : "border-gray-200"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center min-h-[60px]">
        <div className={`hotspot-marker ${hotspot.dangerLevel}`}>
          {hotspot.label}
        </div>
        <div className="ml-3 flex-grow h-[24px] flex items-center">
          <p className="text-sm font-medium truncate">{hotspot.address}</p>
        </div>
        <div className="flex flex-col min-w-[110px]">
          <div className="grid grid-cols-2 gap-x-5">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 ${getTrafficColor(hotspot.dangerLevel)} rounded-md flex items-center justify-center text-white`}>
                <Footprints className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5 text-gray-500 text-center w-10">{hotspot.dangerLevel.toLowerCase()}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 ${weatherInfo.color} rounded-md flex items-center justify-center text-white`}>
                <WeatherIcon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5 text-gray-500 text-center w-10">{weatherInfo.label}</span>
            </div>
          </div>
        </div>
      </div>
      
      {footTrafficData.length > 0 && (
        <div className="mt-2 w-full">
          <div className="text-[10px] text-gray-500 mb-1 flex justify-between">
            <span>Foot Traffic</span>
            <span className="text-tampere-red">Live + Forecast</span>
          </div>
          <FootTrafficChart data={footTrafficData} />
        </div>
      )}
      
      {isLoading && (
        <div className="h-20 w-full flex items-center justify-center">
          <div className="animate-pulse text-xs text-gray-400">Loading traffic data...</div>
        </div>
      )}
    </div>
  );
};
