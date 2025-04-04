import React from "react";
import { useTampere } from "@/lib/TampereContext";
import { HotspotMarker } from "./HotspotMarker";

export const HotspotsList: React.FC = () => {
  const { hotspots, selectedHotspot, setSelectedHotspot, setSelectedEvent } = useTampere();

  const handleHotspotClick = (hotspot: typeof hotspots[0]) => {
    console.log(`📍 HOTSPOTSLIST: Hotspot clicked - id=${hotspot.id}, label=${hotspot.label}`);
    setSelectedEvent(null);
    // If the clicked hotspot is already selected, deselect it (toggle behavior)
    setSelectedHotspot(selectedHotspot?.id === hotspot.id ? null : hotspot);
  };

  return (
    <div className="mt-6">
      <div className="mb-2 font-medium">Hotspots</div>
      <div className="space-y-1.5 pr-2">
        {hotspots.map((hotspot) => (
          <HotspotMarker
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
