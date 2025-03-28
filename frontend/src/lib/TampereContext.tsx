import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { UnifiedHotspot, TimelineRange } from "./types";
import {
  fetchLocations,
  fetchHotspotFootTraffic,
  fetchEventFootTraffic,
  fetchHotspotDetailedMetrics,
  fetchEventDetailedMetrics,
  trafficDataCache,
  trafficPointsCache,
  fetchLLMSummary
} from "./api";
import { getTrafficCacheKey } from "./utils";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`🌐 CONTEXT DEBUG: ${message}`, data || '');
};

// Add debounce utility at the top level
interface DebouncedFunction extends Function {
  cancel?: () => void;
}

const debounce = (func: Function, wait: number): DebouncedFunction => {
  let timeout: NodeJS.Timeout;
  const executedFunction: DebouncedFunction = function (...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };

  executedFunction.cancel = () => {
    clearTimeout(timeout);
  };

  return executedFunction;
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

  // Add detailed metrics state
  detailedMetrics: any | null;
  setDetailedMetrics: (metrics: any | null) => void;

  // Add detailed metrics cache and in-flight requests
  getDetailedMetrics: (locationId: string, type: 'hotspot' | 'event') => Promise<any>;

  // Legacy comparison properties for backward compatibility
  isHotspotCompareMode: boolean;
  isEventCompareMode: boolean;
  selectedHotspotsForComparison: UnifiedHotspot[];
  selectedEventsForComparison: UnifiedHotspot[];
  setIsHotspotCompareMode: (mode: boolean) => void;
  setIsEventCompareMode: (mode: boolean) => void;

  // Add business and location info
  selectedBusiness: string | undefined;
  selectedArea: string | undefined;
  cacheVersion: number;

  // LLM Summary Cache and In-Flight Tracking
  getLLMSummary: (opts: {
    locationId: string;
    businessRequirement: string;
    metrics: any;
    locationType: string;
    instructions: string;
  }) => Promise<string>;
}

const TampereContext = createContext<TampereContextType | undefined>(undefined);

export const TampereProvider: React.FC<{
  children: React.ReactNode;
  initialBusiness?: string;
  initialLocation?: string;
}> = ({ children, initialBusiness, initialLocation }) => {
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

  // Store business and location info
  const [selectedBusiness] = useState<string | undefined>(initialBusiness);
  const [selectedArea] = useState<string | undefined>(initialLocation);

  // Unified locations state (includes both types of hotspots)
  const [locations, setLocations] = useState<UnifiedHotspot[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<UnifiedHotspot | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedLocationsForComparison, setSelectedLocationsForComparison] = useState<UnifiedHotspot[]>([]);

  const [pulse, setPulse] = useState<boolean>(false);
  const [timePeriod, setTimePeriod] = useState<'real-time' | 'daily' | 'weekly' | 'monthly'>('real-time');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Add detailed metrics state
  const [detailedMetrics, setDetailedMetrics] = useState<any | null>(null);

  // Add detailed metrics cache and in-flight requests
  const [detailedMetricsCache, setDetailedMetricsCache] = useState<{ [key: string]: any }>({});
  const inFlightRequests = useRef<{ [key: string]: Promise<any> }>({});

  // Add cache version state
  const [cacheVersion, setCacheVersion] = useState(0);

  // LLM Summary Cache and In-Flight Tracking
  const [llmSummaryCache, setLLMSummaryCache] = useState<{ [key: string]: string }>({});
  const llmInFlightRequests = useRef<{ [key: string]: Promise<string> }>({});

  // Unified function to get detailed metrics (with cache and in-flight tracking)
  const getDetailedMetrics = async (locationId: string, type: 'hotspot' | 'event') => {
    // 1. Return from cache if available
    if (detailedMetricsCache[locationId]) {
      debugLog(`Cache hit for detailed metrics: ${locationId}`);
      return detailedMetricsCache[locationId];
    }
    // 2. If a request is in-flight, return its promise
    if (inFlightRequests.current[locationId]) {
      debugLog(`In-flight request for detailed metrics: ${locationId}`);
      return inFlightRequests.current[locationId];
    }
    // 3. Otherwise, start a new request
    debugLog(`Fetching detailed metrics from API: ${locationId} (${type})`);
    const fetchFn = type === 'hotspot' ? fetchHotspotDetailedMetrics : fetchEventDetailedMetrics;
    const promise = fetchFn(locationId)
      .then(data => {
        setDetailedMetricsCache(prev => ({ ...prev, [locationId]: data }));
        delete inFlightRequests.current[locationId];
        return data;
      })
      .catch(err => {
        delete inFlightRequests.current[locationId];
        throw err;
      });
    inFlightRequests.current[locationId] = promise;
    return promise;
  };

  /**
   * Returns a cached or in-flight LLM summary for a location/business combo, or fetches if missing.
   * @param {object} opts - { locationId, businessRequirement, metrics, locationType, instructions }
   * @returns {Promise<string>} The summary string
   */
  const getLLMSummary = async ({ locationId, businessRequirement, metrics, locationType, instructions }: {
    locationId: string;
    businessRequirement: string;
    metrics: any;
    locationType: string;
    instructions: string;
  }): Promise<string> => {
    if (!locationId || !businessRequirement) return "Select a hotspot or event to see business opportunities analysis.";
    const cacheKey = `${locationId}::${businessRequirement}`;
    // 1. Return from cache if available
    if (llmSummaryCache[cacheKey]) {
      debugLog(`LLM summary cache hit: ${cacheKey}`);
      return llmSummaryCache[cacheKey];
    }
    // 2. If a request is in-flight, return its promise
    if (llmInFlightRequests.current[cacheKey]) {
      debugLog(`LLM summary in-flight: ${cacheKey}`);
      return llmInFlightRequests.current[cacheKey];
    }
    // 3. Otherwise, start a new request
    debugLog(`Fetching LLM summary from API: ${cacheKey}`);
    const payload = {
      business_requirement: businessRequirement,
      metrics,
      location_type: locationType,
      instructions,
    };
    const promise = fetchLLMSummary(payload)
      .then(summary => {
        setLLMSummaryCache(prev => ({ ...prev, [cacheKey]: summary }));
        delete llmInFlightRequests.current[cacheKey];
        return summary;
      })
      .catch(err => {
        delete llmInFlightRequests.current[cacheKey];
        throw err;
      });
    llmInFlightRequests.current[cacheKey] = promise;
    return promise;
  };

  // Fetch locations (both natural and event hotspots)
  useEffect(() => {
    debugLog("Setting up debounced location fetching");

    const getLocations = async () => {
      try {
        // Format date as YYYY-MM-DD
        const dateToFetch = new Date(selectedDate);
        dateToFetch.setHours(12, 0, 0, 0);
        const formattedDate = dateToFetch.toISOString().split('T')[0];
        debugger;

        // Call fetchLocations with the appropriate parameters
        debugLog(`API call: fetchLocations(${timePeriod}, ${formattedDate}, ${JSON.stringify(timelineRange)})`);
        const responseData = await fetchLocations(
          timePeriod,
          formattedDate,
          timelineRange
        );

        // Store traffic data and points in the cache
        const cacheKey = getTrafficCacheKey(selectedDate, timelineRange);
        debugLog('CONTEXT CACHE KEY DEBUG', { cacheKey, selectedDate, timelineRange });

        if (responseData.traffic_data) {
          debugLog(`Directly caching traffic data for cacheKey=${cacheKey}`);
          trafficDataCache[cacheKey] = responseData.traffic_data;
          debugLog(`trafficDataCache[${cacheKey}] set:`, {
            featureCount: responseData.traffic_data.features?.length ?? 0,
            firstFeature: responseData.traffic_data.features?.[0] ?? null
          });
          setCacheVersion(v => v + 1);
        }

        if (responseData.traffic_points) {
          debugLog(`Directly caching traffic points for cacheKey=${cacheKey}`);
          trafficPointsCache[cacheKey] = responseData.traffic_points;
          debugLog(`trafficPointsCache[${cacheKey}] set:`, {
            featureCount: responseData.traffic_points.features?.length ?? 0,
            firstFeature: responseData.traffic_points.features?.[0] ?? null
          });
          setCacheVersion(v => v + 1);
        }

        debugLog(`Fetched ${responseData.locations.length} locations successfully`);
        setLocations(responseData.locations);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch locations:", err);
        debugLog("Error fetching locations", err);
        setError("Failed to fetch locations. Please try again later.");
        setLoading(false);
      }
    };

    // Create a debounced version of getLocations
    const debouncedGetLocations = debounce(() => {
      setLoading(true);
      getLocations();
    }, 300); // 300ms debounce delay

    debouncedGetLocations();

    // Cleanup function to cancel any pending debounced calls
    return () => {
      debouncedGetLocations.cancel?.();
    };
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

      // If we're starting a new comparison, or all items are of the same type as the new one
      if (prev.length === 0 || prev[0].type === location.type) {
        return [...prev, location];
      }

      // If trying to add a different type, replace current selection with the new one
      debugLog(`Comparison type changed from ${prev[0].type} to ${location.type}`);
      return [location];
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

  // Update legacy functions to use the cache-aware function
  const loadHotspotDetailedMetrics = async (hotspotId: string) => {
    return getDetailedMetrics(hotspotId, 'hotspot');
  };

  const loadEventDetailedMetrics = async (eventId: string) => {
    return getDetailedMetrics(eventId, 'event');
  };

  // Legacy comparison properties for backward compatibility
  const isHotspotCompareMode = isCompareMode && selectedLocationsForComparison.some(loc => loc.type === 'natural');
  const isEventCompareMode = isCompareMode && selectedLocationsForComparison.some(loc => loc.type === 'event');
  const selectedHotspotsForComparison = selectedLocationsForComparison.filter(loc => loc.type === 'natural');
  const selectedEventsForComparison = selectedLocationsForComparison.filter(loc => loc.type === 'event');

  const setIsHotspotCompareMode = (mode: boolean) => {
    setIsCompareMode(mode);
    // If turning off hotspot compare mode, clear all hotspots from comparison
    if (!mode) {
      setSelectedLocationsForComparison(prev => prev.filter(loc => loc.type !== 'natural'));
    }
  };

  const setIsEventCompareMode = (mode: boolean) => {
    setIsCompareMode(mode);
    // If turning off event compare mode, clear all events from comparison
    if (!mode) {
      setSelectedLocationsForComparison(prev => prev.filter(loc => loc.type !== 'event'));
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
        detailedMetrics,
        setDetailedMetrics,
        getDetailedMetrics,

        isHotspotCompareMode,
        isEventCompareMode,
        selectedHotspotsForComparison,
        selectedEventsForComparison,
        setIsHotspotCompareMode,
        setIsEventCompareMode,

        selectedBusiness,
        selectedArea,
        cacheVersion,
        getLLMSummary,
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