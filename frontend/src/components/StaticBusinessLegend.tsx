import React from "react";
import { Store, Building2, CircleDot, MapPin } from "lucide-react";

export const StaticBusinessLegend: React.FC = () => {
  const mapItems = [
    { icon: <CircleDot className="text-tampere-red" size={16} />, label: "Selected Zone" },
    { icon: <Building2 className="text-blue-800" size={16} />, label: "Business Zone" },
    { icon: <Store className="text-orange-600" size={16} />, label: "Available Space" },
    { icon: <MapPin className="text-green-600" size={16} />, label: "Potential Location" }
  ];

  return (
    <div className="bg-white bg-opacity-90 rounded-md shadow-sm p-2 border border-gray-100 max-w-[150px]">
      <div className="flex flex-col gap-y-1">
        {mapItems.map((item, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              {item.icon}
            </div>
            <span className="text-xs font-medium text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}; 