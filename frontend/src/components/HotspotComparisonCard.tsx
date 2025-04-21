import React from 'react';
import { Footprints, MapPin, Users, Clock, Building } from 'lucide-react';
import { Hotspot } from '@/lib/types';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type HotspotComparisonCardProps = {
  hotspot: Hotspot;
};

export const HotspotComparisonCard: React.FC<HotspotComparisonCardProps> = ({ hotspot }) => {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 w-[170px] flex-shrink-0 flex flex-col h-[330px]">
      <div className="p-2 border-b border-gray-200 flex flex-col justify-center min-h-[60px]">
        <div className="flex items-center mb-1">
          <div className={`hotspot-card ${hotspot.trafficLevel?.toLowerCase()} !h-4 !w-4 !text-xs !flex !items-center !justify-center mr-2 flex-shrink-0`}>
            {hotspot.label}
          </div>
          <h3 className="text-sm font-medium truncate">{hotspot.name}</h3>
        </div>
      </div>
      
      <div className="p-2 flex-grow flex flex-col">
        <div className="grid grid-cols-2 gap-2 text-xs py-2 border-b border-gray-100 h-[60px]">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500 mb-0.5 whitespace-nowrap">Traffic</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="font-medium capitalize w-full overflow-hidden text-ellipsis whitespace-nowrap text-center cursor-pointer">{hotspot.trafficLevel}</p>
              </TooltipTrigger>
              <TooltipContent>{hotspot.trafficLevel}</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500 mb-0.5 whitespace-nowrap">Area Type</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="font-medium text-center w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer">{hotspot.areaType || 'Commercial'}</p>
              </TooltipTrigger>
              <TooltipContent>{hotspot.areaType || 'Commercial'}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex-grow flex flex-col">
          <div className="flex items-center py-2 border-b border-gray-100 h-[40px]">
            <div className="w-4 h-4 mr-1.5 flex-shrink-0">
              <Footprints className="w-4 h-4 text-tampere-red" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer">
                  <span className="text-gray-500 mr-1">Foot Traffic:</span>
                  <span className="font-medium">{hotspot.avgDailyTraffic || 'Moderate'}</span>
                </p>
              </TooltipTrigger>
              <TooltipContent>{hotspot.avgDailyTraffic || 'Moderate'}</TooltipContent>
            </Tooltip>
          </div>
          
          <div className="flex items-center py-2 border-b border-gray-100 h-[40px]">
            <div className="w-4 h-4 mr-1.5 flex-shrink-0">
              <Clock className="w-4 h-4 text-tampere-red" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer">
                  <span className="text-gray-500 mr-1">Peak Hour:</span>
                  <span className="font-medium">{hotspot.peakHour || '17:00'}</span>
                </p>
              </TooltipTrigger>
              <TooltipContent>{hotspot.peakHour || '17:00'}</TooltipContent>
            </Tooltip>
          </div>
          
          <div className="flex items-center py-2 border-b border-gray-100 h-[40px]">
            <div className="w-4 h-4 mr-1.5 flex-shrink-0">
              <Users className="w-4 h-4 text-tampere-red" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer">
                  <span className="text-gray-500 mr-1">Population:</span>
                  <span className="font-medium">{hotspot.population || 'N/A'}</span>
                </p>
              </TooltipTrigger>
              <TooltipContent>{hotspot.population || 'N/A'}</TooltipContent>
            </Tooltip>
          </div>
          
          <div className="flex items-center py-2 border-b border-gray-100 h-[40px]">
            <div className="w-4 h-4 mr-1.5 flex-shrink-0">
              <Building className="w-4 h-4 text-tampere-red" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer">
                  <span className="text-gray-500 mr-1">Nearby Business:</span>
                  <span className="font-medium">{hotspot.nearbyBusinesses || 'N/A'}</span>
                </p>
              </TooltipTrigger>
              <TooltipContent>{hotspot.nearbyBusinesses || 'N/A'}</TooltipContent>
            </Tooltip>
          </div>
          
          <div className="flex items-center py-2 h-[40px]">
            <div className="w-4 h-4 mr-1.5 flex-shrink-0">
              <Users className="w-4 h-4 text-tampere-red" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer">
                  <span className="text-gray-500 mr-1">Demographics:</span>
                  <span className="font-medium">{hotspot.dominantDemographics || 'Mixed'}</span>
                </p>
              </TooltipTrigger>
              <TooltipContent>{hotspot.dominantDemographics || 'Mixed'}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}; 