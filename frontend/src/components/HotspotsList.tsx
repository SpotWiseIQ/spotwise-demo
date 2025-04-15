import React from "react";
import { useTampere } from "@/lib/TampereContext";
import { HotspotCard } from "./HotspotCard";
import { CompareToggle } from "./CompareToggle";

export const HotspotsList: React.FC = () => {
  const { 
    hotspots, 
    selectedHotspot, 
    setSelectedHotspot, 
    setSelectedEvent,
    isHotspotCompareMode,
    setIsHotspotCompareMode,
    isEventCompareMode,
    setIsEventCompareMode,
    selectedHotspotsForComparison,
    toggleHotspotComparison
  } = useTampere();

  const handleHotspotClick = (hotspot: (typeof hotspots)[0]) => {
    // If in compare mode, ignore clicks on the card itself
    if (isHotspotCompareMode) {
      return;
    }

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

  const handleCompareToggle = () => {
    // When enabling hotspot compare mode, disable event compare mode
    if (!isHotspotCompareMode) {
      setIsEventCompareMode(false);
    }
    setIsHotspotCompareMode(!isHotspotCompareMode);
  };

  return (
    <div className="mt-6">
      <div className="mb-2 font-medium flex items-center justify-between">
        <span>Hotspots</span>
        <CompareToggle 
          isCompareMode={isHotspotCompareMode} 
          onToggle={handleCompareToggle} 
        />
      </div>
      <div className="space-y-1.5 pr-2">
        {hotspots.map((hotspot) => (
          <HotspotCard
            key={hotspot.id}
            hotspot={hotspot}
            selected={isHotspotCompareMode 
              ? selectedHotspotsForComparison.some(h => h.id === hotspot.id)
              : selectedHotspot?.id === hotspot.id}
            onClick={() => handleHotspotClick(hotspot)}
            isCompareMode={isHotspotCompareMode}
            onCompareClick={() => toggleHotspotComparison(hotspot)}
          />
        ))}
      </div>
    </div>
  );
};
