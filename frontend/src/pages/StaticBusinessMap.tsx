import React, { useState } from "react";
import { TampereProvider } from "@/lib/TampereContext";
import { StaticBusinessSidebar } from "@/components/StaticBusinessSidebar";
import { StaticBusinessMap } from "@/components/StaticBusinessMap";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const StaticBusinessMapPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <TampereProvider>
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
        <div className={`${sidebarCollapsed ? 'w-full' : 'w-2/3'} h-full transition-all duration-300`}>
          <StaticBusinessMap />
        </div>
      </div>
    </TampereProvider>
  );
};

export default StaticBusinessMapPage; 