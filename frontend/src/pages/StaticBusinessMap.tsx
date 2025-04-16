import React, { useState, useEffect } from "react";
import { TampereProvider } from "@/lib/TampereContext";
import { StaticBusinessSidebar } from "@/components/StaticBusinessSidebar";
import { StaticBusinessMap } from "@/components/StaticBusinessMap";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchBusinessLocations } from "@/lib/api";
import { Zone } from "@/components/ZoneCard";

interface BusinessLocation {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  type: string;
}

const StaticBusinessMapPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [businessLocations, setBusinessLocations] = useState<BusinessLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  
  // Fetch business locations when the component mounts
  useEffect(() => {
    const getBusinessLocations = async () => {
      try {
        const locations = await fetchBusinessLocations();
        setBusinessLocations(locations);
      } catch (error) {
        console.error("Failed to fetch business locations:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getBusinessLocations();
  }, []);
  
  // Filter business locations based on the selected zone
  const filteredBusinessLocations = selectedZone 
    ? businessLocations.filter(business => {
        // Calculate distance between business and zone center (approximate)
        const latDiff = Math.abs(business.coordinates[1] - selectedZone.coordinates[1]);
        const lngDiff = Math.abs(business.coordinates[0] - selectedZone.coordinates[0]);
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        // Consider businesses within a small radius (roughly 1 km)
        return distance < 0.01;
      })
    : businessLocations;
  
  return (
    <TampereProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <div className={`${sidebarCollapsed ? 'w-0' : 'w-1/3'} border-r border-gray-200 bg-white transition-all duration-300 relative`}>
          <StaticBusinessSidebar onZoneSelect={setSelectedZone} />
          <Button 
            variant="outline" 
            size="icon" 
            className={`absolute top-1/2 right-0 -translate-y-1/2 ${sidebarCollapsed ? 'translate-x-full' : 'translate-x-1/2'} z-10 bg-white border border-gray-200 rounded-full shadow-md`}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>
        <div className={`${sidebarCollapsed ? 'w-full' : 'w-2/3'} h-full transition-all duration-300`}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading business locations...</p>
            </div>
          ) : (
            <StaticBusinessMap 
              businessLocations={filteredBusinessLocations} 
              selectedZone={selectedZone}
            />
          )}
        </div>
      </div>
    </TampereProvider>
  );
};

export default StaticBusinessMapPage; 