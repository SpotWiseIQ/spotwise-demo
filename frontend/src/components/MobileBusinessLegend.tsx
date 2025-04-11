import React from "react";
import { Bus, Train, CalendarClock, CircleDot, SquareParking } from "lucide-react";
import { useTampere } from "@/lib/TampereContext";

export const MobileBusinessLegend: React.FC = () => {
  const { pulse } = useTampere();
  
  const mapItems = [
    { icon: <CalendarClock className="text-red-500" size={16} />, label: "Events" },
    { icon: <CircleDot className="text-green-600" size={16} />, label: "Hotspots" },
    { icon: <Bus className="text-blue-600" size={16} />, label: "Bus Stop" },
    { icon: <Train className="text-purple-700" size={16} />, label: "Tram Stop" },
    { icon: <SquareParking className="text-blue-800" size={16} />, label: "Parking" }
  ];

  const trafficItems = [
    { color: "#4caf50", label: "Low traffic" },
    { color: "#ffc107", label: "Medium traffic" },
    { color: "#ea384c", label: "High traffic" },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md">
      <div className="space-y-2">
        <div className="space-y-1">
          {mapItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </div>
          ))}
        </div>
        
        {pulse && (
          <>
            <div className="border-t border-gray-200 my-2" />
            <div className="space-y-1">
              {trafficItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-4 h-1 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 