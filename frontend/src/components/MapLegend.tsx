import React from "react";
import { BadgeCheck, CalendarClock, Bus, Building2, ParkingSquare, HelpCircle } from "lucide-react";
import { useTampere } from "@/lib/TampereContext";

export const MapLegend: React.FC = () => {
  const { pulse } = useTampere();
  
  const mapItems = [
    { icon: <BadgeCheck className="text-green-500" size={18} />, label: "Available" },
    { icon: <CalendarClock className="text-red-500" size={18} />, label: "Event loc." },
    { icon: <Bus className="text-blue-500" size={18} />, label: "Bus stop" },
    { icon: <HelpCircle className="text-purple-800" size={18} />, label: "Tram stop" },
    { icon: <Building2 className="text-orange-600" size={18} />, label: "Business" },
    { icon: <ParkingSquare className="text-blue-800" size={18} />, label: "Parking" }
  ];

  const trafficItems = [
    { color: "#4caf50", label: "Low foot traffic" },
    { color: "#ffc107", label: "Medium foot traffic" },
    { color: "#ea384c", label: "High foot traffic" },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
      <div className="space-y-2">
        {trafficItems.map((item, index) => (
          <div key={`traffic-${index}`} className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
