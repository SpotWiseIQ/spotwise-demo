import React, { useState } from 'react';
import { useStaticBusiness } from '@/lib/StaticBusinessContext';
import { X, ChevronDown, Car, Footprints, Clock, Users, Building } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PolarRadiusAxis
} from 'recharts';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

// Add global CSS for scrollbar hiding
const hideScrollbarStyles = `
.hide-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}
`;

export const StaticBusinessComparisonCard: React.FC<{ zone: any }> = ({ zone }) => {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 w-[170px] flex-shrink-0 flex flex-col h-[330px]">
      <div className="p-2 border-b border-gray-200 flex flex-col justify-center min-h-[60px]">
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
            <Car className="w-4 h-4 text-tampere-red" />
          </div>
          <h3 className="text-sm font-medium truncate">{zone.name}</h3>
        </div>
      </div>
      <div className="p-2 flex-grow flex flex-col">
        <div className="grid grid-cols-2 gap-2 text-xs py-2 border-b border-gray-100 h-[60px]">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500 mb-0.5 whitespace-nowrap">Car Flow</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="font-medium w-full overflow-hidden text-ellipsis whitespace-nowrap text-center cursor-pointer">{zone.carFlow?.toLocaleString() || 'N/A'}/day</p>
              </TooltipTrigger>
              <TooltipContent>{zone.carFlow?.toLocaleString() || 'N/A'}/day</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500 mb-0.5 whitespace-nowrap">Foot Traffic</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="font-medium w-full overflow-hidden text-ellipsis whitespace-nowrap text-center cursor-pointer">{zone.footTraffic?.toLocaleString() || 'N/A'}/day</p>
              </TooltipTrigger>
              <TooltipContent>{zone.footTraffic?.toLocaleString() || 'N/A'}/day</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="flex-grow flex flex-col">
          <div className="flex items-center py-2 border-b border-gray-100 h-[40px]">
            <div className="w-4 h-4 mr-1.5 flex-shrink-0">
              <Clock className="w-4 h-4 text-tampere-red" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer">
                  <span className="text-gray-500 mr-1">Avg Parking:</span>
                  <span className="font-medium">{zone.avgParkingTime || 'N/A'} min</span>
                </p>
              </TooltipTrigger>
              <TooltipContent>{zone.avgParkingTime || 'N/A'} min</TooltipContent>
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
                  <span className="font-medium">{zone.population?.toLocaleString() || 'N/A'}</span>
                </p>
              </TooltipTrigger>
              <TooltipContent>{zone.population?.toLocaleString() || 'N/A'}</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center py-2 h-[40px]">
            <div className="w-4 h-4 mr-1.5 flex-shrink-0">
              <Building className="w-4 h-4 text-tampere-red" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer">
                  <span className="text-gray-500 mr-1">Area Type:</span>
                  <span className="font-medium">{zone.areaType || 'N/A'}</span>
                </p>
              </TooltipTrigger>
              <TooltipContent>{zone.areaType || 'N/A'}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StaticBusinessComparisonView: React.FC = () => {
  const {
    isZoneCompareMode,
    selectedZonesForComparison,
    clearComparisons
  } = useStaticBusiness();
  
  const [selectedMetric, setSelectedMetric] = useState('carFlow');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Don't render if not in compare mode or no zones selected
  if (!isZoneCompareMode || selectedZonesForComparison.length === 0) {
    return null;
  }

  // Define available metrics for comparison
  const zoneMetrics = [
    { id: 'carFlow', label: 'Car Flow' },
    { id: 'footTraffic', label: 'Foot Traffic' },
    { id: 'avgParkingTime', label: 'Average Parking Time' },
    { id: 'population', label: 'Population' },
    { id: 'nearbyBusinesses', label: 'Nearby Businesses' }
  ];

  // Prepare data for radar chart
  const radarData = selectedZonesForComparison.map(zone => ({
    name: zone.name,
    'Car Flow': normalizeValue(zone.carFlow, 'carFlow'),
    'Foot Traffic': normalizeValue(zone.footTraffic, 'footTraffic'),
    'Parking Time': normalizeValue(zone.avgParkingTime, 'avgParkingTime'),
    'Population': normalizeValue(zone.population || 0, 'population'),
    'Nearby Businesses': normalizeValue(zone.nearbyBusinesses || 0, 'nearbyBusinesses')
  }));

  // Helper function to normalize values between 0 and 100
  function normalizeValue(value: number, metric: string): number {
    const maxValues = {
      carFlow: 15000,
      footTraffic: 10000,
      avgParkingTime: 120,
      population: 50000,
      nearbyBusinesses: 50
    };
    return (value / maxValues[metric as keyof typeof maxValues]) * 100;
  }

  // Prepare data for bar chart based on selected metric
  const barData = selectedZonesForComparison.map(zone => ({
    name: zone.name,
    value: zone[selectedMetric as keyof typeof zone] || 0
  }));

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div className="w-full max-w-3xl mx-auto bg-white bg-opacity-95 flex flex-col rounded-lg shadow-xl overflow-hidden border border-gray-200">
        {/* Add global styles once */}
        <style dangerouslySetInnerHTML={{ __html: hideScrollbarStyles }} />
        
        {/* Top section - Comparison cards */}
        <div className="px-3 pt-2 border-b border-gray-200 pb-1 flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-sm font-semibold text-tampere-red">
              Zone Comparison
            </h2>
            <button 
              className="p-1 rounded-full hover:bg-gray-200 text-gray-600"
              onClick={clearComparisons}
              aria-label="Close comparison view"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Scrollable cards container */}
          <div className="overflow-x-auto overflow-y-hidden hide-scrollbar" style={{ maxHeight: '370px' }}>
            <div className="flex space-x-3 pb-2 min-w-max">
              {selectedZonesForComparison.map(zone => (
                <StaticBusinessComparisonCard key={zone.id} zone={zone} />
              ))}
            </div>
          </div>
        </div>
        
        {/* Bottom section - Comparison charts */}
        <div className="bg-gray-50 p-2" style={{ minHeight: '250px' }}>
          <div className="flex justify-between items-center mb-2">
            <div className="relative">
              <button 
                className="flex items-center text-xs text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 shadow-sm hover:bg-gray-50"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {zoneMetrics.find(m => m.id === selectedMetric)?.label || 'Select Metric'} <ChevronDown size={12} className="ml-1" />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200">
                  {zoneMetrics.map(metric => (
                    <button
                      key={metric.id}
                      className={`block w-full text-left px-4 py-2 text-xs ${selectedMetric === metric.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      onClick={() => {
                        setSelectedMetric(metric.id);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {metric.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Bar Chart */}
            <div className="bg-white rounded-lg shadow-sm p-2 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip contentStyle={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px' }} />
                  <Bar dataKey="value" fill="#ea384c" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Chart */}
            <div className="bg-white rounded-lg shadow-sm p-2 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  {selectedZonesForComparison.map((zone, index) => (
                    <Radar
                      key={zone.id}
                      name={zone.name}
                      dataKey={Object.keys(radarData[0])[index + 1]}
                      stroke="#ea384c"
                      fill="#ea384c"
                      fillOpacity={0.3}
                    />
                  ))}
                  <RechartsTooltip contentStyle={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 