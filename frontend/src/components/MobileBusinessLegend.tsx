import React from "react";
import { CircleDot, CalendarDays, Bus, Train, Store, SquareParking } from "lucide-react";
import { useTampere } from "@/lib/TampereContext";

// Helper to map POI category to icon
const getPOIIcon = (category: string) => {
  switch (category) {
    case "Parking":
      return <SquareParking className="text-blue-800" size={16} />;
    case "Bus Stop":
      return <Bus className="text-blue-600" size={16} />;
    case "Tram Stop":
      return <Train className="text-purple-700" size={16} />;
    case "Business":
      return <Store className="text-orange-600" size={16} />;
    default:
      return <Store className="text-gray-400" size={16} />;
  }
};

export const MobileBusinessLegend: React.FC = () => {
  const { pulse } = useTampere();

  const mapItems = [
    { icon: <CircleDot className="text-green-600" size={16} />, label: "Available" },
    { icon: <CalendarDays className="text-red-500" size={16} />, label: "Events" },
    { icon: <Bus className="text-blue-600" size={16} />, label: "Bus stop" },
    { icon: <Train className="text-purple-700" size={16} />, label: "Tram stop" },
    { icon: <Store className="text-orange-600" size={16} />, label: "Business" },
    { icon: <SquareParking className="text-blue-800" size={16} />, label: "Parking" }
  ];

  const trafficItems = [
    { color: "#4caf50", label: "Low traffic" },
    { color: "#ffc107", label: "Medium traffic" },
    { color: "#c83e36", label: "High traffic" },
  ];

  return (
    <div className="bg-white bg-opacity-90 rounded-md shadow-sm p-2 border border-gray-100 max-w-[200px]">
      <div className="flex flex-col gap-y-1">
        {/* Legend */}
        {mapItems.map((item, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              {item.icon}
            </div>
            <span className="text-xs font-medium text-gray-700">{item.label}</span>
          </div>
        ))}
        {pulse && (
          <>
            <div className="border-t border-gray-100 my-0.5"></div>
            {trafficItems.map((item, index) => (
              <div key={`traffic-${index}`} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}; 