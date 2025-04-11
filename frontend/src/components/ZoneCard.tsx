import React from "react";
import { MapPin, Car, Clock, Users } from "lucide-react";

export interface Zone {
  id: string;
  name: string;
  distance: number;
  carFlow: number;
  avgParkingTime: number;
  footTraffic: number;
  coordinates: [number, number];
}

type ZoneCardProps = {
  zone: Zone;
  onClick?: () => void;
  selected?: boolean;
};

export const ZoneCard: React.FC<ZoneCardProps> = ({
  zone,
  onClick,
  selected,
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`flex flex-col my-1 bg-gray-50 rounded-lg border transition-all duration-200 ease-in-out ${
        selected
          ? "ring-2 ring-tampere-red border-tampere-red shadow-md"
          : "border-gray-200 hover:shadow-sm"
      }`}
    >
      <div className="p-2 cursor-pointer" onClick={handleCardClick}>
        <div className="flex items-start mb-2">
          <div className="text-tampere-red mt-1">
            <MapPin size={18} />
          </div>
          <div className="ml-3 flex-grow min-w-0">
            <p className="text-sm font-medium truncate" title={zone.name}>
              {zone.name}
            </p>
            <p className="text-xs text-gray-500">
              {zone.distance.toFixed(1)} km away
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-y-2 pl-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Car size={14} className="mr-1.5 text-gray-500 flex-shrink-0" />
              <span className="text-gray-500 text-xs">Car Flow:</span>
            </div>
            <span className="text-sm font-medium">{zone.carFlow.toLocaleString()} vehicles/day</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock size={14} className="mr-1.5 text-gray-500 flex-shrink-0" />
              <span className="text-gray-500 text-xs">Avg Parking:</span>
            </div>
            <span className="text-sm font-medium">{zone.avgParkingTime} min</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users size={14} className="mr-1.5 text-gray-500 flex-shrink-0" />
              <span className="text-gray-500 text-xs">Foot Traffic:</span>
            </div>
            <span className="text-sm font-medium">{zone.footTraffic.toLocaleString()} people/day</span>
          </div>
        </div>
      </div>

      {selected && (
        <div className="border-t border-gray-200 mx-2 mt-1 mb-2 pt-3 px-1">
          {/* Reserved for future expanded content */}
        </div>
      )}
    </div>
  );
}; 