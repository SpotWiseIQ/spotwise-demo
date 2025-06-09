import React, { useMemo } from "react";
import { useTampere } from "@/lib/TampereContext";
import { NaturalHotspotCard } from "./NaturalHotspotCard";
import { CompareToggle } from "./CompareToggle";
import { EventHotspotCard } from "./EventHotspotCard";

interface HotspotsListProps {
  searchQuery?: string;
}

export const HotspotsList: React.FC<HotspotsListProps> = ({ searchQuery = "" }) => {
  const {
    locations,
    selectedLocation,
    setSelectedLocation,
    isCompareMode,
    setIsCompareMode,
    selectedLocationsForComparison,
    toggleLocationComparison,
    loading,
    error,
    loadHotspotDetailedMetrics,
    loadEventDetailedMetrics,
    setDetailedMetrics
  } = useTampere();

  // Filter locations based on search query
  const filteredLocations = useMemo(() => {
    if (!searchQuery) return locations;
    const query = searchQuery.toLowerCase();
    return locations.filter(location => {
      // Search in name
      const nameMatch = location.type === 'natural'
        ? location.name.toLowerCase().includes(query)
        : location.event_name.toLowerCase().includes(query);

      // Search in type
      const typeMatch = location.type === 'natural'
        ? 'hotspot'.includes(query) || 'natural'.includes(query)
        : 'event'.includes(query);

      return nameMatch || typeMatch;
    });
  }, [locations, searchQuery]);

  const handleLocationClick = async (location: (typeof locations)[0]) => {
    if (isCompareMode) {
      return;
    }
    // Enhanced logging with colors
    console.log(
      `%c📍 CLICK EVENT: Location clicked - id=${location.id}, label=${location.label}, type=${location.type}`,
      'background: #e91e63; color: white; font-weight: bold; padding: 3px 5px; border-radius: 3px;'
    );
    console.log(
      `%c👉 ACTION: ${selectedLocation?.id === location.id ? 'Deselecting' : 'Selecting'} location`,
      'background: #673ab7; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;'
    );
    // If the clicked location is already selected, deselect it (toggle behavior)
    if (selectedLocation?.id === location.id) {
      setSelectedLocation(null);
      setDetailedMetrics(null);
    } else {
      setSelectedLocation(location);
      // Always fetch detailed metrics from the locations endpoint
      const metrics = await loadHotspotDetailedMetrics(location.id);
      setDetailedMetrics(metrics);
    }
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
        ) : filteredLocations.length === 0 ? (
          <div className="text-gray-500 text-sm py-2">No hotspots match your search</div>
        ) : (
          filteredLocations.map((location) =>
            location.type === 'natural' ? (
              <NaturalHotspotCard
                key={location.id}
                hotspot={{
                  ...location,
                  name: "🔥TEST: " + location.name // <-- Add this line for testing
                }}
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
                event={{
                  ...location,
                  event_name: "🔥Event TEST: " + location.event_name // <-- Add this line for testing
                }}
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
