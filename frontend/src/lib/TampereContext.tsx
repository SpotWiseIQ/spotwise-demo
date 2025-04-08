import React, { createContext, useContext, useState, useEffect } from "react";
import { Event, Hotspot, TimelineRange } from "./types";
import { 
  fetchHotspots, 
  fetchEvents, 
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
  selectedHotspot: Hotspot | null;
  setSelectedHotspot: (hotspot: Hotspot | null) => void;
  selectedEvent: Event | null;
  setSelectedEvent: (event: Event | null) => void;
  pulse: boolean;
  setPulse: (pulse: boolean) => void;
  hotspots: Hotspot[];
  events: Event[];
  loading: boolean;
  error: string | null;
  timePeriod: 'real-time' | 'daily' | 'weekly' | 'monthly';
  setTimePeriod: (period: 'real-time' | 'daily' | 'weekly' | 'monthly') => void;
  loadHotspotFootTraffic: (hotspotId: string) => Promise<any>;
  loadEventFootTraffic: (eventId: string) => Promise<any>;
  loadHotspotDetailedMetrics: (hotspotId: string) => Promise<any>;
  loadEventDetailedMetrics: (eventId: string) => Promise<any>;
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
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [pulse, setPulse] = useState<boolean>(false);
  const [timePeriod, setTimePeriod] = useState<'real-time' | 'daily' | 'weekly' | 'monthly'>('real-time');
  
  // State for API data
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Handler for date changes that clears the selected event
  const handleDateChange = (newDate: Date) => {
    debugLog("Date changing", { 
      from: selectedDate.toISOString(), 
      to: newDate.toISOString(),
      fromDate: selectedDate.toISOString().split('T')[0],
      toDate: newDate.toISOString().split('T')[0]
    });
    
    // Clear selected event when date changes
    if (selectedEvent) {
      debugLog("Clearing selected event due to date change");
      setSelectedEvent(null);
    }
    
    setSelectedDate(newDate);
  };

  // Custom state setters with logging
  const loggedSetSelectedHotspot = (hotspot: Hotspot | null) => {
    debugLog("Setting selected hotspot", hotspot ? { id: hotspot.id, label: hotspot.label } : 'null');
    
    // If we're selecting a hotspot, clear any selected event
    if (hotspot !== null && selectedEvent !== null) {
      debugLog("Clearing selected event because a hotspot was selected");
      setSelectedEvent(null);
    }
    
    setSelectedHotspot(hotspot);
  };

  const loggedSetSelectedEvent = (event: Event | null) => {
    debugLog("Setting selected event", event ? { id: event.id, name: event.name } : 'null');
    
    // If we're selecting an event, clear any selected hotspot
    if (event !== null && selectedHotspot !== null) {
      debugLog("Clearing selected hotspot because an event was selected");
      setSelectedHotspot(null);
    }
    
    setSelectedEvent(event);
  };

  // Fetch hotspots every time the date, time period, or timeline changes
  useEffect(() => {
    debugLog("Fetching hotspots");
    const getHotspots = async () => {
      try {
        // Format date as YYYY-MM-DD
        const dateToFetch = new Date(selectedDate);
        dateToFetch.setHours(12, 0, 0, 0);
        const formattedDate = dateToFetch.toISOString().split('T')[0];
        
        // Call fetchHotspots with the appropriate parameters
        debugLog(`API call: fetchHotspots(${timePeriod}, ${formattedDate}, ${JSON.stringify(timelineRange)})`);
        const data = await fetchHotspots(
          timePeriod,
          formattedDate,
          timelineRange
        );
        
        debugLog(`Fetched ${data.length} hotspots successfully`);
        setHotspots(data);
      } catch (err) {
        console.error("Failed to fetch hotspots:", err);
        debugLog("Error fetching hotspots", err);
        setError("Failed to fetch hotspots. Please try again later.");
      }
    };

    getHotspots();
  }, [selectedDate, timePeriod, timelineRange]);

  // Fetch events only when date or timeline changes and no selection is active
  useEffect(() => {
    // Skip fetching if there's a selected item
    if (selectedHotspot || selectedEvent) {
      debugLog("Skipping events fetch - there is a selected item");
      return;
    }

    // Get YYYY-MM-DD format, but ensure we're using the actual selected date
    // by creating a fixed version with consistent time (noon) to avoid timezone issues
    const dateToFetch = new Date(selectedDate);
    dateToFetch.setHours(12, 0, 0, 0);
    const formattedDate = dateToFetch.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Use selected time from the timeline slider instead of system time
    // Convert from percentage to hour (0-23)
    const selectedTime = Math.round(timelineRange.start / 100 * 24);
    
    debugLog(`🔎 START: Fetching events for date: ${formattedDate}, selectedTime: ${selectedTime} (from date ${selectedDate.toISOString()})`);
    
    const getEvents = async () => {
      setLoading(true);
      try {
        debugLog(`API call: fetchEvents(${formattedDate}, ${selectedTime})`);
        const data = await fetchEvents(formattedDate, selectedTime);
        debugLog(`🔎 FETCH RESULT: ${data.length} events for date ${formattedDate}`);
        setEvents(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        debugLog("Error fetching events", err);
        setError("Failed to fetch events. Please try again later.");
        setEvents([]);
      } finally {
        setLoading(false);
        debugLog("Finished loading events, loading state set to false");
      }
    };

    getEvents();
  }, [selectedDate, timelineRange, selectedHotspot, selectedEvent]);

  // Debug state changes
  useEffect(() => {
    debugLog("Context state updated", { 
      hotspotsCount: hotspots.length, 
      eventsCount: events.length,
      hasSelectedHotspot: !!selectedHotspot,
      hasSelectedEvent: !!selectedEvent,
      loading,
      error
    });
  }, [hotspots, events, selectedHotspot, selectedEvent, loading, error]);

  // Function to load foot traffic data for a specific hotspot
  const loadHotspotFootTraffic = async (hotspotId: string) => {
    debugLog(`Loading foot traffic data for hotspot ${hotspotId}`);
    try {
      // Find the hotspot in the already loaded data
      const hotspot = hotspots.find(h => h.id === hotspotId);
      if (hotspot && hotspot.footTraffic) {
        // Use the foot traffic data from the hotspot if available
        debugLog(`Using pre-loaded foot traffic data for hotspot ${hotspotId}`);
        return hotspot.footTraffic;
      }
      
      // Fall back to API call if not available (should be rare)
      debugLog(`Foot traffic data not found in hotspot ${hotspotId}, falling back to API call`);
      const data = await fetchHotspotFootTraffic(hotspotId);
      debugLog(`Fetched foot traffic data for hotspot ${hotspotId}`, data);
      return data;
    } catch (err) {
      console.error(`Failed to fetch foot traffic for hotspot ${hotspotId}:`, err);
      debugLog(`Error fetching foot traffic for hotspot ${hotspotId}`, err);
      throw new Error("Failed to fetch foot traffic data.");
    }
  };

  // Function to load foot traffic data for a specific event
  const loadEventFootTraffic = async (eventId: string) => {
    debugLog(`Loading foot traffic data for event ${eventId}`);
    try {
      // Find the event in the already loaded data
      const event = events.find(e => e.id === eventId);
      if (event && event.footTraffic) {
        // Use the foot traffic data from the event if available
        debugLog(`Using pre-loaded foot traffic data for event ${eventId}`);
        return event.footTraffic;
      }
      
      // Fall back to API call if not available (should be rare)
      debugLog(`Foot traffic data not found in event ${eventId}, falling back to API call`);
      const data = await fetchEventFootTraffic(eventId);
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
        setSelectedDate: handleDateChange,
        timelineRange,
        setTimelineRange,
        selectedHotspot,
        setSelectedHotspot: loggedSetSelectedHotspot,
        selectedEvent,
        setSelectedEvent: loggedSetSelectedEvent,
        pulse,
        setPulse,
        hotspots,
        events,
        loading,
        error,
        timePeriod,
        setTimePeriod,
        loadHotspotFootTraffic,
        loadEventFootTraffic,
        loadHotspotDetailedMetrics,
        loadEventDetailedMetrics
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