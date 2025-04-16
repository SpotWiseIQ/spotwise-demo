import React, { useState, useEffect } from "react";
import { StaticBusinessProvider } from "@/lib/StaticBusinessContext";
import { StaticBusinessSidebar } from "@/components/StaticBusinessSidebar";
import { StaticBusinessMap } from "@/components/StaticBusinessMap";
import { StaticBusinessComparisonView } from "@/components/StaticBusinessComparisonView";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchBusinessLocations } from "@/lib/api";
import { useSearchParams } from "react-router-dom";

interface BusinessLocation {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  type: string;
}

const StaticBusinessMapPage = () => {
  const [searchParams] = useSearchParams();
  const selectedBusiness = searchParams.get('business') || undefined;
  const selectedLocation = searchParams.get('location') || undefined;
  
  // Debug log
  console.log('URL Parameters:', { selectedBusiness, selectedLocation });
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [businessLocations, setBusinessLocations] = useState<BusinessLocation[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  
  return (
    <StaticBusinessProvider selectedBusiness={selectedBusiness} selectedLocation={selectedLocation}>
      <div className="flex h-screen w-full overflow-hidden">
        <div className={`${sidebarCollapsed ? 'w-0' : 'w-1/3'} border-r border-gray-200 bg-white transition-all duration-300 relative`}>
          <StaticBusinessSidebar />
          <Button 
            variant="outline" 
            size="icon" 
            className={`absolute top-1/2 right-0 -translate-y-1/2 ${sidebarCollapsed ? 'translate-x-full' : 'translate-x-1/2'} z-10 bg-white border border-gray-200 rounded-full shadow-md`}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>
        <div className={`${sidebarCollapsed ? 'w-full' : 'w-2/3'} h-full transition-all duration-300 relative`}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading business locations...</p>
            </div>
          ) : (
            <>
              <StaticBusinessMap businessLocations={businessLocations} />
              <StaticBusinessComparisonView />
            </>
          )}
        </div>
      </div>
    </StaticBusinessProvider>
  );
};

export default StaticBusinessMapPage; 