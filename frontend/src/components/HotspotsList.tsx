import React, { useMemo } from "react";
import { useTampere } from "@/lib/TampereContext";
import { NaturalHotspotCard } from "./NaturalHotspotCard";
import { CompareToggle } from "./CompareToggle";
import { EventHotspotCard } from "./EventHotspotCard";

export const HotspotsList: React.FC = () => {
  const { 
    locations,
    selectedLocation,
    setSelectedLocation,
    isCompareMode,
    setIsCompareMode,
    selectedLocationsForComparison,
    toggleLocationComparison,
    loading,
    error
  } = useTampere();

  const handleLocationClick = (location: (typeof locations)[0]) => {
    // If in compare mode, ignore clicks on the card itself
    if (isCompareMode) {
      return;
    }

    // Enhanced logging with colors
    console.log(
      `%c📍 CLICK EVENT: Location clicked - id=${location.id}, label=${location.label}, type=${location.type}`, 
      'background: #e91e63; color: white; font-weight: bold; padding: 3px 5px; border-radius: 3px;'
    );
    
    // Log the action being taken
    console.log(
      `%c👉 ACTION: ${selectedLocation?.id === location.id ? 'Deselecting' : 'Selecting'} location`,
      'background: #673ab7; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;'
    );
    
    // If the clicked location is already selected, deselect it (toggle behavior)
    setSelectedLocation(selectedLocation?.id === location.id ? null : location);
  };

  const handleCompareToggle = () => {
    setIsCompareMode(!isCompareMode);
  };

  return (
    <div className="mt-6">
      <div className="mb-2 font-medium flex items-center justify-between">
        <span>Hotspots</span>
        <div className="flex gap-2">
          <CompareToggle 
            isCompareMode={isCompareMode} 
            onToggle={handleCompareToggle} 
          />
        </div>
      </div>
      <div className="space-y-1.5 pr-2">
        {loading ? (
          <div className="text-gray-500 text-sm py-2">Loading hotspots...</div>
        ) : error ? (
          <div className="text-red-500 text-sm py-2">{error}</div>
        ) : locations.length === 0 ? (
          <div className="text-gray-500 text-sm py-2">No hotspots for this date and time</div>
        ) : (
          locations.map((location) => 
            location.type === 'natural' ? (
              <NaturalHotspotCard
                key={location.id}
                hotspot={location}
                selected={isCompareMode 
                  ? selectedLocationsForComparison.some(l => l.id === location.id)
                  : selectedLocation?.id === location.id}
                onClick={() => handleLocationClick(location)}
                isCompareMode={isCompareMode}
                onCompareClick={() => toggleLocationComparison(location)}
              />
            ) : (
              <EventHotspotCard
                key={location.id}
                event={location}
                selected={isCompareMode 
                  ? selectedLocationsForComparison.some(l => l.id === location.id)
                  : selectedLocation?.id === location.id}
                onClick={() => handleLocationClick(location)}
                isCompareMode={isCompareMode}
                onCompareClick={() => toggleLocationComparison(location)}
              />
            )
          )
        )}
      </div>
    </div>
  );
};
