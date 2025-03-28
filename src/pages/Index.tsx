
import React from "react";
import { TampereProvider } from "@/lib/TampereContext";
import { LeftSidebar } from "@/components/LeftSidebar";
import { TampereMap } from "@/components/TampereMap";

const Index = () => {
  return (
    <TampereProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <div className="w-2/5 border-r border-gray-200 bg-white">
          <LeftSidebar />
        </div>
        <div className="w-3/5">
          <TampereMap />
        </div>
      </div>
    </TampereProvider>
  );
};

export default Index;
