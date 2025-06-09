import React, { useState } from "react";
import { TampereProvider } from "@/lib/TampereContext";
import { MobileBusinessSidebar } from "@/components/MobileBusinessSidebar";
import { MobileBusinessMap } from "@/components/MobileBusinessMap";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";

console.log("MOBILE BUSINESS MAP PAGE RENDERED");

const MobileBusinessMapPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchParams] = useSearchParams();
  const selectedBusiness = searchParams.get('business') || undefined;
  const selectedLocation = searchParams.get('location') || undefined;

  return (
    <TampereProvider initialBusiness={selectedBusiness} initialLocation={selectedLocation}>
      <div className="flex h-screen w-full overflow-hidden">
        <div className={`${sidebarCollapsed ? 'w-0' : 'w-1/3'} border-r border-gray-200 bg-white transition-all duration-300 relative`}>
          <MobileBusinessSidebar />
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
          <MobileBusinessMap />
        </div>
      </div>
    </TampereProvider>
  );
};

export default MobileBusinessMapPage;
