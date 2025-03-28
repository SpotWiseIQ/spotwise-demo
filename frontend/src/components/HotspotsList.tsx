import React from "react";
import { useTampere } from "@/lib/TampereContext";
import { HotspotMarker } from "./HotspotMarker";

export const HotspotsList: React.FC = () => {
  const { hotspots, selectedHotspot, setSelectedHotspot, setSelectedEvent } = useTampere();

  const handleHotspotClick = (hotspot: typeof hotspots[0]) => {
    setSelectedEvent(null);
    setSelectedHotspot(hotspot);
  };

  return (
    <div className="mb-6">
      <div className="mb-2 font-medium">Hotspots</div>
      <div className="space-y-1.5 max-h-[290px] overflow-y-auto pr-2">
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
