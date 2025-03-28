
import React from "react";
import { Plus, Calendar, Bus, Building, Parking, HelpCircle } from "lucide-react";

export const MapLegend: React.FC = () => {
  const items = [
    { icon: <Plus className="text-green-500" size={18} />, label: "Available" },
    { icon: <Calendar className="text-red-500" size={18} />, label: "Event loc." },
    { icon: <Bus className="text-blue-500" size={18} />, label: "Bus stop" },
    { icon: <HelpCircle className="text-purple-800" size={18} />, label: "Tram stop" },
    { icon: <Building className="text-gray-800" size={18} />, label: "Business" },
    { icon: <Parking className="text-blue-500" size={18} />, label: "Parking" }
  ];

  return (
    <div className="absolute left-6 bottom-20 z-10 bg-white rounded-lg shadow-md p-3 border border-gray-200">
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
