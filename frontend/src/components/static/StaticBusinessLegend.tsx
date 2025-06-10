import React from "react";
import { Droplets, Train, ShoppingBasket, SquareParking, Coffee } from "lucide-react";

// Inline SVG for Bus Stop (matches marker SVG)
const BusStopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bus text-blue-600" width={16} height={16}>
    <path d="M19 17h2l.64-2.54c.24-.959.24-1.962 0-2.92l-1.07-4.27A3 3 0 0 0 17.66 5H4a2 2 0 0 0-2 2v10h2" />
    <path d="M14 17H9" />
    <circle cx="6.5" cy="17.5" r="2.5" />
    <circle cx="16.5" cy="17.5" r="2.5" />
  </svg>
);

export const StaticBusinessLegend: React.FC = () => {
  // Reduced map items to only show the most likely categories to appear
  const mapItems = [
    { icon: <Droplets className="text-blue-500" size={16} />, label: "Car Wash", important: true },
    { icon: <BusStopIcon />, label: "Bus Stop" },
    { icon: <ShoppingBasket className="text-orange-600" size={16} />, label: "Shopping" },
    { icon: <SquareParking className="text-blue-800" size={16} />, label: "Parking" },
    { icon: <Coffee className="text-amber-600" size={16} />, label: "Food" }
  ];

  return (
    <div className="bg-white bg-opacity-90 rounded-md shadow-sm p-2 border border-gray-100 max-w-[150px]">
      <div className="flex flex-col gap-y-1">
        {mapItems.map((item, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div className={`flex-shrink-0 w-5 h-5 flex items-center justify-center ${item.important ? 'bg-blue-100 border border-blue-300 rounded-full' : ''}`}>
              {item.icon}
            </div>
            <span className={`text-xs font-medium ${item.important ? 'text-blue-700 font-semibold' : 'text-gray-700'}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}; 