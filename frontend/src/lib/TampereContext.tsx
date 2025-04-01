import React, { createContext, useContext, useState, useEffect } from "react";
import { Event, Hotspot, TimelineRange } from "./types";
import { fetchHotspots, fetchEvents, fetchHotspotFootTraffic } from "./api";

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
}

const TampereContext = createContext<TampereContextType | undefined>(undefined);

export const TampereProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  debugLog("TampereProvider initializing");
  
  // Initialize with noon time to avoid timezone issues
  const initialDate = new Date("2025-03-26T12:00:00");
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [timelineRange, setTimelineRange] = useState<TimelineRange>({ start: 50, end: 75 });
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

  // Fetch hotspots
  useEffect(() => {
    debugLog("Fetching hotspots");
    const getHotspots = async () => {
      try {
        debugLog("API call: fetchHotspots");
        const data = await fetchHotspots();
        debugLog(`Fetched ${data.length} hotspots successfully`);
        setHotspots(data);
      } catch (err) {
        console.error("Failed to fetch hotspots:", err);
        debugLog("Error fetching hotspots", err);
        setError("Failed to fetch hotspots. Please try again later.");
      }
    };

    getHotspots();
  }, []);

  // Fetch events whenever selectedDate changes
  useEffect(() => {
    // Get YYYY-MM-DD format, but ensure we're using the actual selected date
    // by creating a fixed version with consistent time (noon) to avoid timezone issues
    const dateToFetch = new Date(selectedDate);
    dateToFetch.setHours(12, 0, 0, 0);
    const formattedDate = dateToFetch.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    debugLog(`🔎 START: Fetching events for date: ${formattedDate} (from date ${selectedDate.toISOString()})`);
    console.log(`🔎 STATE BEFORE FETCH: ${events.length} events currently in state`);
    events.forEach((event, index) => {
      console.log(`  Event ${index+1}: id=${event.id}, name=${event.name}, date=${event.date}`);
    });
    
    const getEvents = async () => {
      setLoading(true);
      try {
        debugLog(`API call: fetchEvents(${formattedDate})`);
        const data = await fetchEvents(formattedDate);
        debugLog(`🔎 FETCH RESULT: ${data.length} events for date ${formattedDate}:`);
        data.forEach((event, index) => {
          console.log(`  Event ${index+1}: id=${event.id}, name=${event.name}, date=${event.date}`);
        });
        
        // Set the events in state
        console.log(`🔎 UPDATING STATE: Setting ${data.length} events in state`);
        setEvents(data);
        setError(null);
        
        // Debug one more time after state set
        setTimeout(() => {
          console.log(`🔎 STATE CHECK: Current events in state after update: ${data.length}`);
        }, 0);
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
    
    // Debug cleanup function
    return () => {
      console.log(`🔎 CLEANUP: Events fetch effect for date ${formattedDate}`);
    };
  }, [selectedDate]);

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
      const data = await fetchHotspotFootTraffic(hotspotId);
      debugLog(`Fetched foot traffic data for hotspot ${hotspotId}`, data);
      return data;
    } catch (err) {
      console.error(`Failed to fetch foot traffic for hotspot ${hotspotId}:`, err);
      debugLog(`Error fetching foot traffic for hotspot ${hotspotId}`, err);
      throw new Error("Failed to fetch foot traffic data.");
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
