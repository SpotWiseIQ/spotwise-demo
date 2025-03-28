
import React from "react";
import { Hotspot } from "@/lib/types";
import { AlertTriangle, Cloud, Sun } from "lucide-react";

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
  return (
    <div
      className={`flex items-center p-2 my-2 bg-white rounded-lg border cursor-pointer transition-all hover:shadow-md ${
        selected ? "ring-2 ring-tampere-red border-tampere-red" : "border-gray-200"
      }`}
      onClick={onClick}
    >
      <div className={`hotspot-marker ${hotspot.dangerLevel}`}>
        {hotspot.label}
      </div>
      <div className="ml-3 flex-grow">
        <p className="text-sm font-medium">{hotspot.address}</p>
      </div>
      <div className="flex space-x-2">
        <div
          className={`flex items-center justify-center px-2 py-1 rounded-md text-xs text-white bg-danger-${hotspot.dangerLevel}`}
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          <span>{hotspot.dangerLevel}</span>
        </div>
        <div
          className={`flex items-center justify-center px-2 py-1 rounded-md text-xs text-white bg-weather-${hotspot.weather}`}
        >
          {hotspot.weather === "sunny" ? (
            <Sun className="w-3 h-3 mr-1" />
          ) : (
            <Cloud className="w-3 h-3 mr-1" />
          )}
          <span>{hotspot.weather}</span>
        </div>
      </div>
    </div>
  );
};
