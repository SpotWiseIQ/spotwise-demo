import React from "react";
import { useTampere } from "@/lib/TampereContext";
import { HotspotCard } from "./HotspotCard";

export const HotspotsList: React.FC = () => {
  const { hotspots, selectedHotspot, setSelectedHotspot, setSelectedEvent } =
    useTampere();

  const handleHotspotClick = (hotspot: (typeof hotspots)[0]) => {
    // Enhanced logging with colors
    console.log(
      `%c📍 CLICK EVENT: Hotspot clicked - id=${hotspot.id}, label=${hotspot.label}`, 
      'background: #e91e63; color: white; font-weight: bold; padding: 3px 5px; border-radius: 3px;'
    );
    
    // Log the action being taken
    console.log(
      `%c👉 ACTION: ${selectedHotspot?.id === hotspot.id ? 'Deselecting' : 'Selecting'} hotspot`,
      'background: #673ab7; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;'
    );
    
    setSelectedEvent(null);
    // If the clicked hotspot is already selected, deselect it (toggle behavior)
    setSelectedHotspot(selectedHotspot?.id === hotspot.id ? null : hotspot);
  };

  return (
    <div className="mt-6">
      <div className="mb-2 font-medium">Hotspots</div>
      <div className="space-y-1.5 pr-2">
        {hotspots.map((hotspot) => (
          <HotspotCard
            key={hotspot.id}
            hotspot={hotspot}
            selected={selectedHotspot?.id === hotspot.id}
            onClick={() => handleHotspotClick(hotspot)}
          />
        ))}
      </div>
    </div>
  );
};
