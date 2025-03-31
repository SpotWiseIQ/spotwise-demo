import React from "react";
import { Hotspot } from "@/lib/types";
import { Cloud, Sun, Footprints, Wind, CloudRain } from "lucide-react";

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
      className={`flex items-center p-2 my-1.5 bg-gray-50 rounded-lg border cursor-pointer transition-all hover:shadow-md min-h-[60px] ${
        selected ? "ring-2 ring-tampere-red border-tampere-red" : "border-gray-200"
      }`}
      onClick={onClick}
    >
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
  );
};
