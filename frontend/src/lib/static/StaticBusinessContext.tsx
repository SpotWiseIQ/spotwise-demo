import React, { createContext, useContext, useState } from "react";
import { Zone } from "@/components/ZoneCard";

interface StaticBusinessContextType {
  selectedZone: Zone | null;
  setSelectedZone: (zone: Zone | null) => void;
  selectedBusiness: string | undefined;
  selectedLocation: string | undefined;
  isZoneCompareMode: boolean;
  setIsZoneCompareMode: (mode: boolean) => void;
  selectedZonesForComparison: Zone[];
  addZoneToComparison: (zone: Zone) => void;
  removeZoneFromComparison: (zoneId: string) => void;
  clearComparisons: () => void;
}

const StaticBusinessContext = createContext<StaticBusinessContextType | undefined>(undefined);

export const StaticBusinessProvider: React.FC<{ 
  children: React.ReactNode;
  selectedBusiness?: string;
  selectedLocation?: string;
}> = ({ children, selectedBusiness, selectedLocation }) => {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isZoneCompareMode, setIsZoneCompareMode] = useState(false);
  const [selectedZonesForComparison, setSelectedZonesForComparison] = useState<Zone[]>([]);

  const addZoneToComparison = (zone: Zone) => {
    if (selectedZonesForComparison.length < 4 && !selectedZonesForComparison.find(z => z.id === zone.id)) {
      setSelectedZonesForComparison([...selectedZonesForComparison, zone]);
    }
  };

  const removeZoneFromComparison = (zoneId: string) => {
    setSelectedZonesForComparison(selectedZonesForComparison.filter(zone => zone.id !== zoneId));
  };

  const clearComparisons = () => {
    setIsZoneCompareMode(false);
    setSelectedZonesForComparison([]);
  };

  return (
    <StaticBusinessContext.Provider
      value={{
        selectedZone,
        setSelectedZone,
        selectedBusiness,
        selectedLocation,
        isZoneCompareMode,
        setIsZoneCompareMode,
        selectedZonesForComparison,
        addZoneToComparison,
        removeZoneFromComparison,
        clearComparisons,
      }}
    >
      {children}
    </StaticBusinessContext.Provider>
  );
};

export const useStaticBusiness = () => {
  const context = useContext(StaticBusinessContext);
  if (context === undefined) {
    throw new Error("useStaticBusiness must be used within a StaticBusinessProvider");
  }
  return context;
}; 