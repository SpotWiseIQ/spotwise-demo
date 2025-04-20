import React, { createContext, useContext, useState, useEffect } from "react";
import { UnifiedHotspot, TimelineRange } from "./types";
import { 
  fetchLocations,
  fetchHotspotFootTraffic, 
  fetchEventFootTraffic,
  fetchHotspotDetailedMetrics,
  fetchEventDetailedMetrics
} from "./api";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`🌐 CONTEXT DEBUG: ${message}`, data || '');
};

interface TampereContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  timelineRange: TimelineRange;
  setTimelineRange: (range: TimelineRange) => void;
  
  // Unified locations state (includes both natural and event hotspots)
  locations: UnifiedHotspot[];
  selectedLocation: UnifiedHotspot | null;
  setSelectedLocation: (location: UnifiedHotspot | null) => void;
  
  // Single compare mode for all locations
  isCompareMode: boolean;
  setIsCompareMode: (mode: boolean) => void;
  selectedLocationsForComparison: UnifiedHotspot[];
  toggleLocationComparison: (location: UnifiedHotspot) => void;
  
  loading: boolean;
  error: string | null;
  timePeriod: 'real-time' | 'daily' | 'weekly' | 'monthly';
  setTimePeriod: (period: 'real-time' | 'daily' | 'weekly' | 'monthly') => void;
  
  // Legacy methods for backward compatibility
  loadHotspotFootTraffic: (hotspotId: string, currentHour?: number) => Promise<any>;
  loadEventFootTraffic: (eventId: string, currentHour?: number) => Promise<any>;
  loadHotspotDetailedMetrics: (hotspotId: string) => Promise<any>;
  loadEventDetailedMetrics: (eventId: string) => Promise<any>;
  
  clearComparisons: () => void;
  pulse: boolean;
  setPulse: (pulse: boolean) => void;
}

const TampereContext = createContext<TampereContextType | undefined>(undefined);

export const TampereProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  debugLog("TampereProvider initializing");
  
  // Initialize with current date and time
  const now = new Date();
  const currentHour = now.getHours();
  
  // Convert current hour to percentage for timeline (0-100 range)
  const currentTimePercentage = Math.round((currentHour / 24) * 100);
  // Set end to be about 25% ahead of current time, but cap at 100
  const endTimePercentage = Math.min(100, currentTimePercentage + 25);
  
  debugLog(`Initializing with current date: ${now.toISOString().split('T')[0]}, hour: ${currentHour}, time percentage: ${currentTimePercentage}`);
  
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const [timelineRange, setTimelineRange] = useState<TimelineRange>({ 
    start: currentTimePercentage, 
    end: endTimePercentage 
  });
  
  // Unified locations state (includes both types of hotspots)
  const [locations, setLocations] = useState<UnifiedHotspot[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<UnifiedHotspot | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedLocationsForComparison, setSelectedLocationsForComparison] = useState<UnifiedHotspot[]>([]);
  
  const [pulse, setPulse] = useState<boolean>(false);
  const [timePeriod, setTimePeriod] = useState<'real-time' | 'daily' | 'weekly' | 'monthly'>('real-time');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch locations (both natural and event hotspots)
  useEffect(() => {
    debugLog("Fetching locations");
    const getLocations = async () => {
      try {
        // Format date as YYYY-MM-DD
        const dateToFetch = new Date(selectedDate);
        dateToFetch.setHours(12, 0, 0, 0);
        const formattedDate = dateToFetch.toISOString().split('T')[0];
        
        // Call fetchLocations with the appropriate parameters
        debugLog(`API call: fetchLocations(${timePeriod}, ${formattedDate}, ${JSON.stringify(timelineRange)})`);
        const data = await fetchLocations(
          timePeriod,
          formattedDate,
          timelineRange
        );
        
        debugLog(`Fetched ${data.length} locations successfully`);
        setLocations(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch locations:", err);
        debugLog("Error fetching locations", err);
        setError("Failed to fetch locations. Please try again later.");
        setLoading(false);
      }
    };

    setLoading(true);
    getLocations();
  }, [selectedDate, timePeriod, timelineRange]);

  // Debug state changes
  useEffect(() => {
    debugLog("Context state updated", { 
      locationsCount: locations.length, 
      naturalCount: locations.filter(l => l.type === 'natural').length,
      eventCount: locations.filter(l => l.type === 'event').length,
      hasSelectedLocation: !!selectedLocation,
      loading,
      error
    });
  }, [locations, selectedLocation, loading, error]);

  // Custom state setters with logging
  const loggedSetSelectedLocation = (location: UnifiedHotspot | null) => {
    debugLog("Setting selected location", location ? { id: location.id, label: location.label, type: location.type } : 'null');
    setSelectedLocation(location);
  };

  // Toggle location comparison (works for both natural and event hotspots)
  const toggleLocationComparison = (location: UnifiedHotspot) => {
    setSelectedLocationsForComparison(prev => {
      const exists = prev.find(l => l.id === location.id);
      if (exists) {
        return prev.filter(l => l.id !== location.id);
      }
      return [...prev, location];
    });
  };

  // Clear all comparisons
  const clearComparisons = () => {
    setSelectedLocationsForComparison([]);
    setIsCompareMode(false);
  };

  // Legacy functions to load foot traffic and detailed metrics
  // These will be kept for backward compatibility
  const loadHotspotFootTraffic = async (hotspotId: string, currentHour?: number) => {
    debugLog(`Loading foot traffic data for hotspot ${hotspotId}${currentHour !== undefined ? ` at hour ${currentHour}` : ''}`);
    try {
      // Find the location in the already loaded data
      const location = locations.find(l => l.id === hotspotId && l.type === 'natural');
      if (location && location.footTraffic) {
        // Use the foot traffic data from the location if available
        debugLog(`Using pre-loaded foot traffic data for hotspot ${hotspotId}`);
        return location.footTraffic;
      }
      
      // Fall back to API call if not available (should be rare)
      debugLog(`Foot traffic data not found in hotspot ${hotspotId}, falling back to API call`);
      const data = await fetchHotspotFootTraffic(hotspotId, currentHour);
      debugLog(`Fetched foot traffic data for hotspot ${hotspotId}`, data);
      return data;
    } catch (err) {
      console.error(`Failed to fetch foot traffic for hotspot ${hotspotId}:`, err);
      debugLog(`Error fetching foot traffic for hotspot ${hotspotId}`, err);
      throw new Error("Failed to fetch hotspot foot traffic data.");
    }
  };

  // Function to load foot traffic data for a specific event
  const loadEventFootTraffic = async (eventId: string, currentHour?: number) => {
    debugLog(`Loading foot traffic data for event ${eventId}${currentHour !== undefined ? ` at hour ${currentHour}` : ''}`);
    try {
      // Find the event in the already loaded data
      const eventLocation = locations.find(l => l.type === 'event' && l.event_id === eventId);
      if (eventLocation && eventLocation.footTraffic) {
        // Use the foot traffic data from the event if available
        debugLog(`Using pre-loaded foot traffic data for event ${eventId}`);
        return eventLocation.footTraffic;
      }
      
      // Fall back to API call if not available (should be rare)
      debugLog(`Foot traffic data not found in event ${eventId}, falling back to API call`);
      const data = await fetchEventFootTraffic(eventId, currentHour);
      debugLog(`Fetched foot traffic data for event ${eventId}`, data);
      return data;
    } catch (err) {
      console.error(`Failed to fetch foot traffic for event ${eventId}:`, err);
      debugLog(`Error fetching foot traffic for event ${eventId}`, err);
      throw new Error("Failed to fetch event foot traffic data.");
    }
  };

  // Function to load detailed metrics for a specific hotspot
  const loadHotspotDetailedMetrics = async (hotspotId: string) => {
    debugLog(`Loading detailed metrics for hotspot ${hotspotId}`);
    try {
      const data = await fetchHotspotDetailedMetrics(hotspotId);
      debugLog(`Fetched detailed metrics for hotspot ${hotspotId}`, data);
      return data;
    } catch (err) {
      console.error(`Failed to fetch detailed metrics for hotspot ${hotspotId}:`, err);
      debugLog(`Error fetching detailed metrics for hotspot ${hotspotId}`, err);
      throw new Error("Failed to fetch hotspot detailed metrics.");
    }
  };

  // Function to load detailed metrics for a specific event
  const loadEventDetailedMetrics = async (eventId: string) => {
    debugLog(`Loading detailed metrics for event ${eventId}`);
    try {
      const data = await fetchEventDetailedMetrics(eventId);
      debugLog(`Fetched detailed metrics for event ${eventId}`, data);
      return data;
    } catch (err) {
      console.error(`Failed to fetch detailed metrics for event ${eventId}:`, err);
      debugLog(`Error fetching detailed metrics for event ${eventId}`, err);
      throw new Error("Failed to fetch event detailed metrics.");
    }
  };

  return (
    <TampereContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        timelineRange,
        setTimelineRange,
        
        locations,
        selectedLocation,
        setSelectedLocation: loggedSetSelectedLocation,
        
        isCompareMode,
        setIsCompareMode,
        selectedLocationsForComparison,
        toggleLocationComparison,
        
        loading,
        error,
        timePeriod,
        setTimePeriod,
        
        loadHotspotFootTraffic,
        loadEventFootTraffic,
        loadHotspotDetailedMetrics,
        loadEventDetailedMetrics,
        
        clearComparisons,
        pulse,
        setPulse,
      }}
    >
      {children}
    </TampereContext.Provider>
  );
};

export const useTampere = () => {
  const context = useContext(TampereContext);
  if (context === undefined) {
    throw new Error("useTampere must be used within a TampereProvider");
  }
  return context;
};