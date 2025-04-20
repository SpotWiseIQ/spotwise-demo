import React, { useState } from 'react';
import { useTampere } from '@/lib/TampereContext';
import { HotspotComparisonCard } from './HotspotComparisonCard';
import { EventComparisonCard } from './EventComparisonCard';
import { ComparisonChart } from './ComparisonChart';
import { X, ChevronDown } from 'lucide-react';

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

export const ComparisonView: React.FC = () => {
  const {
    isHotspotCompareMode,
    isEventCompareMode,
    selectedHotspotsForComparison,
    selectedEventsForComparison,
    clearComparisons,
    setIsHotspotCompareMode,
    setIsEventCompareMode
  } = useTampere();
  
  // State for the selected metric to compare
  const [selectedMetric, setSelectedMetric] = useState('opportunity');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Don't render if not in compare mode or no items selected
  if ((!isHotspotCompareMode && !isEventCompareMode) || 
      (isHotspotCompareMode && selectedHotspotsForComparison.length === 0) ||
      (isEventCompareMode && selectedEventsForComparison.length === 0)) {
    return null;
  }

  const isHotspotComparing = isHotspotCompareMode && selectedHotspotsForComparison.length > 0;
  const isEventComparing = isEventCompareMode && selectedEventsForComparison.length > 0;

  const handleClose = () => {
    clearComparisons();
  };

  // Define available metrics for comparison
  const hotspotMetrics = [
    { id: 'opportunity', label: 'Opportunity Score' },
    { id: 'population', label: 'Population' },
    { id: 'areaType', label: 'Area Type' },
    { id: 'footTraffic', label: 'Avg. Daily Traffic' },
    { id: 'peakHour', label: 'Peak Foot Traffic Hour' },
    { id: 'demographics', label: 'Dominant Demographics' },
    { id: 'nearbyBusinesses', label: 'Nearby Businesses' }
  ];

  const eventMetrics = [
    { id: 'opportunity', label: 'Opportunity Score' },
    { id: 'capacity', label: 'Expected Capacity' },
    { id: 'eventType', label: 'Event Type' },
    { id: 'footTrafficImpact', label: 'Peak Foot Traffic Impact' },
    { id: 'footTraffic', label: 'Avg. Daily Traffic' },
    { id: 'demographics', label: 'Expected Crowd' },
    { id: 'nearbyBusinesses', label: 'Nearby Businesses' }
  ];

  const availableMetrics = isHotspotComparing ? hotspotMetrics : eventMetrics;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div className="w-full max-w-3xl mx-auto bg-white bg-opacity-95 flex flex-col rounded-lg shadow-xl overflow-hidden border border-gray-200">
        {/* Add global styles once */}
        <style dangerouslySetInnerHTML={{ __html: hideScrollbarStyles }} />
        
        {/* Top section - Comparison cards */}
        <div className="px-3 pt-2 border-b border-gray-200 pb-1 flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-sm font-semibold text-tampere-red">
              {isHotspotComparing ? 'Hotspot Comparison' : 'Event Comparison'}
            </h2>
            <button 
              className="p-1 rounded-full hover:bg-gray-200 text-gray-600"
              onClick={handleClose}
              aria-label="Close comparison view"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Scrollable cards container */}
          <div className="overflow-x-auto overflow-y-hidden hide-scrollbar" style={{ maxHeight: '370px' }}>
            <div className="flex space-x-3 pb-2 min-w-max">
              {isHotspotComparing && selectedHotspotsForComparison.map(hotspot => (
                <HotspotComparisonCard key={hotspot.id} hotspot={hotspot} />
              ))}
              
              {isEventComparing && selectedEventsForComparison.map(event => (
                <EventComparisonCard key={event.id} event={event} />
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
                {availableMetrics.find(m => m.id === selectedMetric)?.label || 'Select Metric'} <ChevronDown size={12} className="ml-1" />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200">
                  {availableMetrics.map(metric => (
                    <button
                      key={metric.id}
                      className={`block w-full text-left px-4 py-1 text-[11px] ${selectedMetric === metric.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
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
            
            <div></div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-2">
            <ComparisonChart 
              data={isHotspotComparing 
                ? selectedHotspotsForComparison 
                : selectedEventsForComparison}
              type={isHotspotComparing ? 'hotspot' : 'event'}
              metricType={selectedMetric}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 